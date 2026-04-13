import Phaser from 'phaser';
import { loadMetaProfile } from '../meta/metaProgression.js';
import { createHomePanel } from '../ui/overlayFactory.js';

export class HomeScene extends Phaser.Scene {
  constructor() {
    super('home');
  }

  init(data = {}) {
    this.storage = data.storage ?? globalThis.localStorage;
    this.metaProfile = data.metaProfile ?? loadMetaProfile(this.storage);
    this.lastRunSummary = data.lastRunSummary ?? null;
  }

  create() {
    this.homePanel = createHomePanel(this);
    this.refreshHomePanels();
  }

  startRun() {
    this.scene.start('game', {
      metaProfile: this.metaProfile
    });
  }

  refreshHomePanels() {
    this.homePanel?.update?.({
      soulAsh: this.metaProfile?.meta?.soulAsh ?? 0,
      lastRunSummary: this.lastRunSummary
    });
  }
}
