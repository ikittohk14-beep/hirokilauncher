import React from 'react';
import type { InstanceMeta, LaunchProgress, Account } from '../../../preload/types';
import { BentoGrid } from '../components/BentoGrid';

import type { AppSettings } from '../../../preload/types';
interface HomeProps {
  isEditMode: boolean;
  settings: AppSettings | null;
  instances: InstanceMeta[];
  selectedInstance: InstanceMeta | null;
  onSelectInstance: (instance: InstanceMeta) => void;
  onOpenCreateModal: () => void;
  onOpenManageInstance: (id: string) => void;
  onLaunch: (id: string) => void;
  onKill: (id: string) => void;
  isRunning: boolean;
  launchProgress: LaunchProgress | null;
  activeAccount: Account | null;
}

export const Home: React.FC<HomeProps> = ({
  isEditMode,
  settings,
  instances,
  selectedInstance,
  onSelectInstance,
  onOpenCreateModal,
  onOpenManageInstance,
  onLaunch,
  onKill,
  launchProgress,
  isRunning,
  activeAccount,
}) => {
  return (
    <BentoGrid
      isEditMode={isEditMode}
      settings={settings}
      instances={instances}
      selectedInstance={selectedInstance}
      onSelectInstance={onSelectInstance}
      onAddInstance={onOpenCreateModal}
      onManageInstance={onOpenManageInstance}
      launchStatus={launchProgress}
      isRunning={isRunning}
      currentAccount={activeAccount}
      onLaunch={onLaunch}
      onKill={onKill}
    />
  );
};
