# Deployment Notes

## Version release flow

`VERSION` is the source of truth for the application version.

1. Bump the version:

   ```bash
   npm run version:patch
   ```

   Use `npm run version:minor` or `npm run version:major` when needed.

2. Check that these files contain the same version:

   - `VERSION`
   - `package.json`
   - `package-lock.json`
   - `.env.production` (`REACT_APP_VERSION`)

3. Create a release note in the admin panel. The form uses the current frontend version as the default.

4. Build and deploy.

   Frontend deploy reads `VERSION` and passes:

   - `REACT_APP_VERSION`
   - `REACT_APP_BUILD_TIME`

   Backend deploy passes:

   - `APP_VERSION`
   - `APP_COMMIT`
   - `APP_BUILD_TIME`

5. Verify the deployed version:

   ```bash
   curl -i https://hockeyplanner.ru/api/version
   ```

   Expected JSON fields:

   - `version`
   - `environment`
   - `commit`
   - `buildTime`
   - `timestamp`

## Manual sync

If `VERSION` was edited manually, run:

```bash
npm run version:sync
```

The sync script only updates the app version fields and the `REACT_APP_VERSION` env line. It does not touch secrets.
