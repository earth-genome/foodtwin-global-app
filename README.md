# Global Food System Digital Twin

## Installation and Usage

The steps below will walk you through setting up your own instance of the project.

### Install Project Dependencies

To set up the development environment for this website, you'll need to install the following on your system:

- [Node](http://nodejs.org/) (see version in [.nvmrc](./.nvmrc)) (To manage multiple node versions we recommend [nvm](https://github.com/creationix/nvm))
- [pnpm](https://pnpm.io/installation)
- [Docker](https://www.docker.com/)

### Initialize `.env.local` File

The project uses environment variables, which are set by default in the [.env](.env) file. To customize these variables (e.g., to use a custom database), create a `.env.local` file at the root of the repository (`cp .env .env.local`) and modify as needed.

For more detailed instructions on working with environment variables in Next.js, please consult the [Next.js Environment Variables documentation](https://nextjs.org/docs/basic-features/environment-variables).

Note: The `.env.local` file is configured to be ignored by Git to prevent accidental exposure of sensitive information.

### Install Application Dependencies

If you use [`nvm`](https://github.com/creationix/nvm), activate the desired Node version:

```sh
nvm install
```

Install Node modules:

```sh
pnpm install
```

Start database server:

```sh
docker-compose up
```

Apply migrations and ingest seed data:

```sh
pnpm seed
```

Start development server:

```sh
pnpm dev
```

✨ You can now access the app at [http://localhost:3000](http://localhost:3000)

## License

[MIT](LICENSE)
