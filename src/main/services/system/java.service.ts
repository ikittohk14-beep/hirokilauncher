import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { JavaInstallation } from '../../../preload/types';

const execFileAsync = promisify(execFile);

export class JavaService {
  private static instance: JavaService;

  public static getInstance(): JavaService {
    if (!JavaService.instance) {
      JavaService.instance = new JavaService();
    }
    return JavaService.instance;
  }

  public async detectJavaInstallations(): Promise<JavaInstallation[]> {
    const candidates = new Set<string>();

    // 1. Common Linux/CachyOS paths
    candidates.add('/usr/bin/java');
    candidates.add('/bin/java');

    const jvmDir = '/usr/lib/jvm';
    try {
      if (fs.existsSync(jvmDir)) {
        const entries = fs.readdirSync(jvmDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory() || entry.isSymbolicLink()) {
            const binaryPath = path.join(jvmDir, entry.name, 'bin', 'java');
            if (fs.existsSync(binaryPath)) {
              try {
                const realPath = fs.realpathSync(binaryPath);
                candidates.add(realPath);
              } catch {
                candidates.add(binaryPath);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('[JavaService] Error scanning /usr/lib/jvm:', error);
    }

    // 2. Scan PATH
    const pathEnv = process.env.PATH || '';
    for (const dir of pathEnv.split(':')) {
      if (dir.trim()) {
        const potential = path.join(dir.trim(), 'java');
        if (fs.existsSync(potential)) {
          try {
            candidates.add(fs.realpathSync(potential));
          } catch {
            candidates.add(potential);
          }
        }
      }
    }

    const results: JavaInstallation[] = [];
    const verifiedPaths = new Set<string>();

    for (const javaPath of candidates) {
      if (verifiedPaths.has(javaPath)) continue;
      verifiedPaths.add(javaPath);

      const info = await this.probeJavaPath(javaPath);
      if (info) {
        results.push(info);
      }
    }

    // Sort descending by majorVersion
    return results.sort((a, b) => b.majorVersion - a.majorVersion);
  }

  public async probeJavaPath(javaPath: string): Promise<JavaInstallation | null> {
    try {
      if (!fs.existsSync(javaPath)) {
        return null;
      }

      // java -version writes output to stderr in standard JVMs
      const { stderr, stdout } = await execFileAsync(javaPath, ['-version'], { timeout: 3000 });
      const output = `${stdout}\n${stderr}`;

      // Version regex matching "1.8.0_xxx" or "17.0.2" or "21.0.1"
      const versionMatch = output.match(/version\s+"([^"]+)"/i);
      const rawVersion = versionMatch ? versionMatch[1] : 'Unknown';

      let majorVersion = 0;
      if (rawVersion.startsWith('1.')) {
        const parts = rawVersion.split('.');
        majorVersion = parseInt(parts[1] || '0', 10);
      } else {
        const parts = rawVersion.split(/[\.-]/);
        majorVersion = parseInt(parts[0] || '0', 10);
      }

      const is64Bit = output.includes('64-Bit') || output.includes('x86_64') || output.includes('aarch64');

      let vendor = 'OpenJDK';
      if (output.includes('Temurin')) vendor = 'Eclipse Temurin';
      else if (output.includes('Zulu')) vendor = 'Azul Zulu';
      else if (output.includes('GraalVM')) vendor = 'GraalVM';
      else if (output.includes('HotSpot')) vendor = 'Oracle/OpenJDK HotSpot';
      else if (output.includes('CachyOS')) vendor = 'CachyOS OpenJDK';

      return {
        path: javaPath,
        version: rawVersion,
        majorVersion: isNaN(majorVersion) ? 0 : majorVersion,
        is64Bit,
        vendor,
      };
    } catch (error) {
      console.error(`[JavaService] Failed to probe Java at ${javaPath}:`, error);
      return null;
    }
  }
}
