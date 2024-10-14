interface BlockConfig {
  startTime: number;
  duration: number;
  platforms: string[];
  isUnlockable: boolean;
}

class BlockingService {
  storage: any;
  async setBlock(config: BlockConfig): Promise<void> {
    await this.storage.set('blockConfig', {
      ...config,
      startTime: Date.now(),
    });
  }

  async removeBlock(): Promise<void> {
    const config = await this.getBlockConfig();
    if (config && !config.isUnlockable && Date.now() < config.startTime + config.duration) {
      throw new Error('Block cannot be removed before the duration ends');
    }
    await this.storage.remove('blockConfig');
  }

  async getBlockConfig(): Promise<BlockConfig | null> {
        throw new Error("Method not implemented.");
    }
}

export default BlockingService;
