import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { BrowserWindow, shell } from 'electron';
import type { Account } from '../../../preload/types';
import { SettingsService } from '../storage/settings.service';

interface ElyByAuthResponse {
  accessToken: string;
  clientToken: string;
  selectedProfile: {
    id: string;
    name: string;
  };
  error?: string;
  errorMessage?: string;
}

export class AccountsService {
  private static instance: AccountsService;
  private accountsFilePath: string;
  private accounts: Account[] = [];

  private constructor() {
    const baseDir = SettingsService.getInstance().getBaseDir();
    this.accountsFilePath = path.join(baseDir, 'accounts.json');
    this.loadAccounts();
  }

  public static getInstance(): AccountsService {
    if (!AccountsService.instance) {
      AccountsService.instance = new AccountsService();
    }
    return AccountsService.instance;
  }

  private loadAccounts(): void {
    try {
      if (fs.existsSync(this.accountsFilePath)) {
        const data = fs.readFileSync(this.accountsFilePath, 'utf-8');
        this.accounts = JSON.parse(data);
      } else {
        this.accounts = [];
      }
    } catch (error) {
      console.error('[AccountsService] Failed to load accounts.json:', error);
      this.accounts = [];
    }
  }

  private saveAccounts(): void {
    try {
      const dir = path.dirname(this.accountsFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.accountsFilePath, JSON.stringify(this.accounts, null, 2), 'utf-8');
    } catch (error) {
      console.error('[AccountsService] Failed to save accounts:', error);
    }
  }

  public getAll(): Account[] {
    return [...this.accounts];
  }

  public getActive(): Account | null {
    return this.accounts.find((acc) => acc.isActive) || null;
  }

  public setActive(id: string): boolean {
    let found = false;
    for (const acc of this.accounts) {
      if (acc.id === id) {
        acc.isActive = true;
        found = true;
      } else {
        acc.isActive = false;
      }
    }
    if (found) {
      this.saveAccounts();
    }
    return found;
  }

  public remove(id: string): boolean {
    const initialLen = this.accounts.length;
    this.accounts = this.accounts.filter((acc) => acc.id !== id);
    if (this.accounts.length < initialLen) {
      // If deleted active account, set first one active if available
      if (!this.getActive() && this.accounts.length > 0 && this.accounts[0]) {
        this.accounts[0].isActive = true;
      }
      this.saveAccounts();
      return true;
    }
    return false;
  }

  /**
   * Generates a deterministic UUID v3 for Offline Minecraft accounts
   * MD5("OfflinePlayer:" + username) with RFC 4122 variant & version 3
   */
  private generateOfflineUUID(username: string): string {
    const md5 = crypto.createHash('md5').update(`OfflinePlayer:${username}`).digest();
    // Set version to 3 (0011)
    md5[6] = (md5[6] & 0x0f) | 0x30;
    // Set variant to IETF (10xx)
    md5[8] = (md5[8] & 0x3f) | 0x80;

    const hex = md5.toString('hex');
    return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}`;
  }

  public addOffline(username: string): Account {
    const trimmed = username.trim();
    if (!trimmed) {
      throw new Error('Никнейм не может быть пустым');
    }

    const uuid = this.generateOfflineUUID(trimmed);
    const id = `offline_${uuid}`;

    const existingIndex = this.accounts.findIndex((acc) => acc.id === id);
    const skinUrl = `https://mc-heads.net/avatar/${encodeURIComponent(trimmed)}/100`;

    const newAccount: Account = {
      id,
      username: trimmed,
      uuid,
      type: 'offline',
      skinUrl,
      isActive: this.accounts.length === 0,
    };

    if (existingIndex >= 0) {
      this.accounts[existingIndex] = { ...this.accounts[existingIndex], ...newAccount };
    } else {
      this.accounts.push(newAccount);
    }

    if (this.accounts.length === 1) {
      this.setActive(id);
    } else {
      this.saveAccounts();
    }

    return newAccount;
  }

  /**
   * Authenticates against Ely.by Auth API (Yggdrasil compatible)
   */
  public async loginElyBy(credentials: { login: string; password: string }): Promise<Account> {
    try {
      const clientToken = crypto.randomUUID();
      const response = await fetch('https://authserver.ely.by/auth/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'HirokiLauncher/1.0',
        },
        body: JSON.stringify({
          username: credentials.login.trim(),
          password: credentials.password,
          clientToken,
          agent: {
            name: 'Minecraft',
            version: 1,
          },
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as ElyByAuthResponse;
        const msg = errorData.errorMessage || `Ошибка авторизации Ely.by (HTTP ${response.status})`;
        throw new Error(msg);
      }

      const data = (await response.json()) as ElyByAuthResponse;
      if (data.error || !data.selectedProfile) {
        throw new Error(data.errorMessage || 'Неверный ответ сервера Ely.by');
      }

      const username = data.selectedProfile.name;
      const uuid = data.selectedProfile.id;
      const id = `elyby_${uuid}`;

      // Ely.by skin texture URL and preview avatar
      const skinUrl = `https://skinsystem.ely.by/skins/${encodeURIComponent(username)}.png`;

      const account: Account = {
        id,
        username,
        uuid,
        type: 'elyby',
        skinUrl,
        accessToken: data.accessToken,
        clientToken: data.clientToken,
        isActive: true,
      };

      // Set active
      for (const acc of this.accounts) {
        acc.isActive = false;
      }

      const existingIndex = this.accounts.findIndex((acc) => acc.id === id);
      if (existingIndex >= 0) {
        this.accounts[existingIndex] = account;
      } else {
        this.accounts.push(account);
      }

      this.saveAccounts();
      return account;
    } catch (error) {
      console.error('[AccountsService] loginElyBy failed:', error);
      throw error;
    }
  }

  public async loginBrowserElyBy(): Promise<Account> {
    try {
      const clientId = process.env.ELY_CLIENT_ID || 'ely';
      const scopes = 'account_info offline_access minecraft_server_session';
      
      const deviceCodeRes = await fetch('https://account.ely.by/api/oauth2/v1/devicecode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          scope: scopes,
        }).toString(),
      });

      if (!deviceCodeRes.ok) {
        throw new Error(`Ely.by Device Code Error: ${deviceCodeRes.status}`);
      }

      const deviceData = await deviceCodeRes.json() as any;
      const { device_code, user_code, verification_uri, interval, expires_in } = deviceData;

      const authUrl = `${verification_uri}?user_code=${user_code}`;
      await shell.openExternal(authUrl);

      const maxAttempts = Math.floor(expires_in / interval);
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise(r => setTimeout(r, interval * 1000));

        const tokenRes = await fetch('https://account.ely.by/api/oauth2/v1/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
            device_code: device_code,
          }).toString(),
        });

        const tokenData = await tokenRes.json() as any;
        console.log('[Ely.by] Token API Response:', tokenData);

        if (tokenData.access_token) {
          const profileRes = await fetch('https://account.ely.by/api/account/v1/info', {
            headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
          });

          if (!profileRes.ok) {
            throw new Error(`Failed to fetch Ely.by profile: HTTP ${profileRes.status}`);
          }

          const profileData = await profileRes.json() as any;
          const username = profileData.username || profileData.name;
          const uuid = profileData.uuid || profileData.id || profileData.username;
          const id = `elyby_${uuid}`;
          const skinUrl = `https://skinsystem.ely.by/skins/${encodeURIComponent(username)}.png`;

          const account: Account = {
            id,
            username,
            uuid,
            type: 'elyby',
            skinUrl,
            accessToken: tokenData.access_token,
            clientToken: 'oauth2',
            isActive: true,
          };

          for (const acc of this.accounts) {
            acc.isActive = false;
          }

          const existingIndex = this.accounts.findIndex((acc) => acc.id === id);
          if (existingIndex >= 0) {
            this.accounts[existingIndex] = account;
          } else {
            this.accounts.push(account);
          }

          this.saveAccounts();
          return account;
        } else if (tokenData.error && tokenData.error !== 'authorization_pending') {
          if (tokenData.error === 'expired_token' || tokenData.error === 'access_denied') {
            throw new Error(`Авторизация отклонена или истекла: ${tokenData.error}`);
          }
        }
      }

      throw new Error('Время ожидания авторизации истекло.');
    } catch (err: any) {
      console.error('[AccountsService] loginBrowserElyBy failed:', err);
      throw err;
    }
  }
}
