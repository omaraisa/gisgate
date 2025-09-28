import { ImageMigrationUtils } from './image-migration.js';

// Run the requested utility based on command line args
const command = process.argv[2];

switch (command) {
  case 'find-urls':
    ImageMigrationUtils.findImageUrls();
    break;
  case 'validate':
    ImageMigrationUtils.validateMigration();
    break;
  default:
    console.log('Usage: migration-utils <command>');
    console.log('Commands:');
    console.log('  find-urls    - Find all image URLs in articles');
    console.log('  validate     - Validate migration success');
    process.exit(1);
}