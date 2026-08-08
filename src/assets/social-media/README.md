# Social media assets

Keep source-controlled images for the Social Media Studio in this directory.
Suggested subdirectories are:

- `logos/` for club and opponent crests
- `featured/` for player or match imagery
- `sponsors/` for sponsor marks

Import each image in `pages/SocialMediaStudio/assetManifest.ts` and add it to
the appropriate manifest list. Vite will fingerprint and bundle the asset with
the frontend deployment; it does not use the managed file-storage API.

