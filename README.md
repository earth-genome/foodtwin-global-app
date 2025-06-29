# Global Food System Digital Twin

## Installation and Usage

The steps below will walk you through setting up your own instance of the project.

### Install Project Dependencies

To set up the development environment for this website, you'll need to install the following on your system:

- [Node](http://nodejs.org/) (see version in [.nvmrc](./.nvmrc)) (To manage multiple node versions we recommend [nvm](https://github.com/creationix/nvm))
- [pnpm](https://pnpm.io/installation)
- [GDAL](https://gdal.org/)
- [PostgreSQL](https://www.postgresql.org/)

## Download seed data

The data files are hosted in Google Drive. The recommended approach to download them is:

1. Install the Google Drive desktop app for your operating system
2. In the Google Drive app, sync the Food Twin 2.0/Version3 folder
3. Copy the files to your local seed data directory using rsync to resolve symlinks:

```bash
# Replace SOURCE_PATH with your Google Drive folder path
# TARGET_PATH should match SEED_DATA_PATH in your .env file
rsync -av --copy-links "SOURCE_PATH/Food Twin 2.0/Version3/" TARGET_PATH/
```

### Initialize `.env.local` File

The project uses environment variables, which are set by default in the [.env](.env) file. To customize these variables (e.g., to use a custom database), create a `.env.local` file at the root of the repository (`cp .env .env.local`) and modify as needed.

For more detailed instructions on working with environment variables in Next.js, please consult the [Next.js Environment Variables documentation](https://nextjs.org/docs/basic-features/environment-variables).

Note: The `.env.local` file is configured to be ignored by Git to prevent accidental exposure of sensitive information.

### Start local development server

If you use [`nvm`](https://github.com/creationix/nvm), activate the desired Node version:

```sh
nvm install
```

Install Node modules:

```sh
pnpm install
```

Apply migrations and ingest seed data:

```sh
pnpm db:seed
```

Start development server:

```sh
pnpm dev
```

✨ You can now access the app at [http://localhost:3000](http://localhost:3000)

## Ingesting Data into a Remote Database

The seed command executes an ETL process, transforming model output files for PostgreSQL ingestion, and optimizing with indexes and foreign keys for efficiency. It is not recommended to run this process on a cloud database as it is resource-intensive and can be performed locally.

The recommended steps are:

- Follow the steps in the previous section to populate the local database
- Generate a dump file with `pnpm db:dump`
- Update `DATABASE_URL` in `.env.local` with the remote database connection string
- Restore the remote database with the generated dump file: `pnpm db:restore`

## License

[MIT](LICENSE)
