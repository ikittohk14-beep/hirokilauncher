import React, { useState } from 'react';
import { User, Plus, Trash2, Check, ShieldCheck, KeyRound, X } from 'lucide-react';
import type { Account } from '../../../preload/types';
import { SkinFace } from '../components/SkinFace';

interface AccountsProps {
  accounts: Account[];
  activeAccount: Account | null;
  onRefresh: () => void;
}

export const Accounts: React.FC<AccountsProps> = ({
  accounts,
  activeAccount,
  onRefresh,
}) => {
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);
  const [offlineUsername, setOfflineUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPollingElyBy, setIsPollingElyBy] = useState(false);

  const handleSetActive = async (id: string) => {
    try {
      await window.electronAPI.accounts.setActive(id);
      onRefresh();
    } catch (err) {
      console.error('[Accounts] Failed to set active account:', err);
    }
  };

  const handleRemove = async (id: string, username: string) => {
    if (confirm(`Удалить аккаунт ${username}?`)) {
      try {
        await window.electronAPI.accounts.remove(id);
        onRefresh();
      } catch (err) {
        console.error('[Accounts] Failed to remove account:', err);
      }
    }
  };

  const handleAddOffline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offlineUsername.trim()) return;

    setIsSubmitting(true);
    try {
      await window.electronAPI.accounts.addOffline(offlineUsername.trim());
      setIsOfflineModalOpen(false);
      setOfflineUsername('');
      onRefresh();
    } catch (err) {
      console.error('[Accounts] Failed to add offline account:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <User className="text-[var(--blue)]" />
            <span>Управление аккаунтами</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Поддержка скинов через Ely.by и оффлайн профилей
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOfflineModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-hiroki-card border border-hiroki-border hover:border-slate-600 text-xs font-semibold text-slate-200 hover:text-white transition-all"
          >
            <Plus size={14} />
            <span>Оффлайн аккаунт</span>
          </button>
          <button
            disabled={isPollingElyBy}
            onClick={async () => {
              try {
                setIsPollingElyBy(true);
                await window.electronAPI.accounts.loginBrowserElyBy();
                onRefresh();
              } catch (err) {
                console.error('[Accounts] Ely.by browser login failed:', err);
                alert(`Ошибка авторизации: ${err instanceof Error ? err.message : String(err)}`);
              } finally {
                setIsPollingElyBy(false);
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--blue)] hover:brightness-110 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            <KeyRound size={14} className={isPollingElyBy ? "animate-pulse" : ""} />
            <span>{isPollingElyBy ? "Ожидание браузера..." : "Авторизация (Браузер)"}</span>
          </button>
        </div>
      </div>

      {/* Account Cards */}
      {accounts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-hiroki-border bg-hiroki-card/40 text-center">
          <User size={36} className="text-slate-500 mb-3" />
          <h3 className="text-base font-semibold text-slate-200">Нет сохраненных аккаунтов</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Добавьте оффлайн аккаунт с любым никнеймом или войдите через сервис Ely.by для отображения скинов на серверах и в одиночной игре.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => {
            const isActive = acc.id === activeAccount?.id;
            return (
              <div
                key={acc.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isActive
                    ? 'bg-blue-950/20 border-blue-500/50 shadow-md shadow-blue-500/5'
                    : 'bg-hiroki-card border-hiroki-border hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0">
                        <SkinFace skinUrl={acc.skinUrl} username={acc.username} className="w-full h-full" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                          <span>{acc.username}</span>
                          {acc.type === 'elyby' && (
                            <span title="Ely.by Verified">
                              <ShieldCheck size={14} className="text-[var(--blue)]" />
                            </span>
                          )}
                        </h3>
                        <span className="text-[11px] text-slate-400 capitalize">
                          {acc.type === 'elyby' ? 'Аккаунт Ely.by' : 'Оффлайн режим'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemove(acc.id, acc.username)}
                      className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Удалить"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-hiroki-border/60 flex items-center justify-between">
                  {isActive ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--blue)]">
                      <Check size={14} />
                      <span>Активен</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetActive(acc.id)}
                      className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-hiroki-dark border border-hiroki-border hover:border-slate-600 transition-all"
                    >
                      Выбрать аккаунт
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Offline Modal */}
      {isOfflineModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-hiroki-card border border-hiroki-border rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">Добавить оффлайн аккаунт</h2>
              <button
                onClick={() => setIsOfflineModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddOffline} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Никнейм игрока
                </label>
                <input
                  type="text"
                  required
                  placeholder="Steve"
                  value={offlineUsername}
                  onChange={(e) => setOfflineUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-hiroki-dark border border-hiroki-border rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOfflineModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !offlineUsername.trim()}
                  className="px-4 py-2 rounded-lg bg-[var(--blue)] hover:brightness-110 text-white text-xs font-semibold shadow-md"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
