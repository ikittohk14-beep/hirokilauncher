import React from 'react';
import type { InstanceMeta, LaunchProgress, Account } from '../../../preload/types';
import { BentoGrid } from '../components/BentoGrid';

interface HomeProps {
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
      instances={instances}
      selectedInstance={selectedInstance}
      onSelectInstance={onSelectInstance}
      onAddInstance={onOpenCreateModal}
      onManageInstance={onOpenManageInstance}
      launchStatus={isRunning ? (launchProgress || { percentage: 100, step: 'В игре' }) : launchProgress}
      currentAccount={activeAccount}
      onLaunch={onLaunch}
      onKill={onKill}
    />
  );
};
