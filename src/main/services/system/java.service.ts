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

    if (process.platform === 'win32') {
      // 1. Windows: Check JAVA_HOME
      if (process.env.JAVA_HOME) {
        candidates.add(path.join(process.env.JAVA_HOME, 'bin', 'javaw.exe'));
        candidates.add(path.join(process.env.JAVA_HOME, 'bin', 'java.exe'));
      }

      // 2. Common Windows JVM installation roots
      const progFiles = [
        process.env['ProgramFiles'] || 'C:\\Program Files',
        process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)',
        process.env['LocalAppData'] ? path.join(process.env['LocalAppData'], 'Programs') : '',
      ].filter(Boolean);

      const vendors = ['Java', 'Eclipse Adoptium', 'BellSoft', 'Zulu', 'Amazon Corretto', 'Microsoft'];

      for (const pf of progFiles) {
        for (const vendor of vendors) {
          const vendorDir = path.join(pf, vendor);
          if (fs.existsSync(vendorDir)) {
            try {
              const entries = fs.readdirSync(vendorDir, { withFileTypes: true });
              for (const entry of entries) {
                if (entry.isDirectory()) {
                  const possible = [
                    path.join(vendorDir, entry.name, 'bin', 'javaw.exe'),
                    path.join(vendorDir, entry.name, 'bin', 'java.exe'),
                  ];
                  for (const p of possible) {
                    if (fs.existsSync(p)) candidates.add(p);
                  }
                }
              }
            } catch (err) {
              console.error('[JavaService] Error scanning vendor dir:', vendorDir, err);
            }
          }
        }
      }

      // 3. Scan PATH for Windows
      const pathEnv = process.env.PATH || '';
      for (const dir of pathEnv.split(path.delimiter)) {
        if (dir.trim()) {
          const pJavaw = path.join(dir.trim(), 'javaw.exe');
          const pJava = path.join(dir.trim(), 'java.exe');
          if (fs.existsSync(pJavaw)) candidates.add(pJavaw);
          else if (fs.existsSync(pJava)) candidates.add(pJava);
        }
      }
    } else {
      // 1. Common Linux/CachyOS paths
      candidates.add('/usr/bin/java');
      candidates.add('/bin/java');

      const jvmDir = '/usr/lib/jvm';
      try {
        if (fs.existsSync(jvmDir)) {
          const entries = fs.readdirSync(jvmDir, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isDirectory() || entry.isSymbolicLink()) {
              const possibleBinaries = [
                path.join(jvmDir, entry.name, 'bin', 'java'),
                path.join(jvmDir, entry.name, 'jre', 'bin', 'java'),
              ];
              for (const binaryPath of possibleBinaries) {
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
        }
      } catch (error) {
        console.error('[JavaService] Error scanning /usr/lib/jvm:', error);
      }

      // macOS support if running on darwin
      if (process.platform === 'darwin') {
        const macJvm = '/Library/Java/JavaVirtualMachines';
        if (fs.existsSync(macJvm)) {
          try {
            const entries = fs.readdirSync(macJvm, { withFileTypes: true });
            for (const entry of entries) {
              const p = path.join(macJvm, entry.name, 'Contents', 'Home', 'bin', 'java');
              if (fs.existsSync(p)) candidates.add(p);
            }
          } catch (err) {
            console.error('[JavaService] Error scanning macOS JVMs:', err);
          }
        }
      }

      // 2. Scan PATH
      const pathEnv = process.env.PATH || '';
      for (const dir of pathEnv.split(path.delimiter)) {
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

  public getRecommendedMajorVersion(gameVersion: string, versionJson?: any): number {
    if (versionJson?.javaVersion?.majorVersion) {
      return Number(versionJson.javaVersion.majorVersion);
    }
    const cleanVer = (gameVersion || '').replace(/^v/i, '').trim();
    const match = cleanVer.match(/^1\.(\d+)(?:\.(\d+))?/);
    if (match) {
      const minor = parseInt(match[1], 10);
      const patch = parseInt(match[2] || '0', 10);
      if (minor < 17) return 8;
      if (minor === 17) return 16;
      if (minor < 20) return 17;
      if (minor === 20 && patch < 5) return 17;
      return 21;
    }
    // Snapshots: e.g. "24w04a"
    if (/^\d{2}w/i.test(cleanVer)) {
      const year = parseInt(cleanVer.substring(0, 2), 10);
      if (year <= 20) return 8;
      if (year === 21) return 16;
      if (year <= 23) return 17;
      return 21;
    }
    return 21;
  }

  public async resolveJavaExecutable(
    instanceCustomJavaPath: string | undefined,
    gameVersion: string,
    versionJson?: any,
    settingsJavaPath?: string
  ): Promise<{ path: string; majorVersion: number; warning?: string }> {
    const requiredMajor = this.getRecommendedMajorVersion(gameVersion, versionJson);

    // 1. If custom Java path is explicitly set on instance
    if (instanceCustomJavaPath && fs.existsSync(instanceCustomJavaPath)) {
      const probe = await this.probeJavaPath(instanceCustomJavaPath);
      if (probe) {
        let warning: string | undefined;
        if (requiredMajor === 8 && probe.majorVersion > 8) {
          warning = `Для сборки ${gameVersion} требуется Java 8, но вручную задана Java ${probe.majorVersion}. Возможен сбой запуска.`;
        }
        return { path: instanceCustomJavaPath, majorVersion: probe.majorVersion, warning };
      }
      return { path: instanceCustomJavaPath, majorVersion: 0 };
    }

    // 2. Scan all system Java installations
    const installations = await this.detectJavaInstallations();

    // Priority:
    if (requiredMajor === 8) {
      const j8 = installations.find(i => i.majorVersion === 8);
      if (j8) {
        return { path: j8.path, majorVersion: 8 };
      }
    } else if (requiredMajor === 16) {
      const j16or17 = installations.find(i => i.majorVersion === 17 || i.majorVersion === 16);
      if (j16or17) {
        return { path: j16or17.path, majorVersion: j16or17.majorVersion };
      }
    } else if (requiredMajor === 17) {
      const j17 = installations.find(i => i.majorVersion === 17) || installations.find(i => i.majorVersion >= 17);
      if (j17) {
        return { path: j17.path, majorVersion: j17.majorVersion };
      }
    } else if (requiredMajor === 21) {
      const j21 = installations.find(i => i.majorVersion === 21) || installations.find(i => i.majorVersion >= 21);
      if (j21) {
        return { path: j21.path, majorVersion: j21.majorVersion };
      }
    }

    // Exact match
    const exact = installations.find(i => i.majorVersion === requiredMajor);
    if (exact) {
      return { path: exact.path, majorVersion: exact.majorVersion };
    }

    // 3. Fallback to settings.javaPath or default system Java
    const defaultSysJava = process.platform === 'win32' ? 'javaw.exe' : '/usr/bin/java';
    const fallbackPath = settingsJavaPath && fs.existsSync(settingsJavaPath) ? settingsJavaPath : defaultSysJava;
    const fallbackProbe = await this.probeJavaPath(fallbackPath);
    const fallbackMajor = fallbackProbe?.majorVersion || 0;

    let warning: string | undefined;
    if (requiredMajor === 8 && fallbackMajor > 8) {
      const installHint = process.platform === 'win32'
        ? 'Установите Java 8 (например, Eclipse Temurin 8 или Azul Zulu 8).'
        : 'Установите Java 8: paru -S jre8-openjdk';
      warning = `ВНИМАНИЕ: Для Minecraft ${gameVersion} требуется Java 8, но в системе используется Java ${fallbackMajor} (${fallbackPath}). Старые версии Minecraft крашатся на Java 9+. ${installHint}`;
    }

    return { path: fallbackPath, majorVersion: fallbackMajor, warning };
  }
}
