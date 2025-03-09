# Paramilitary Leaks Frontend

A visualization dashboard for leaked paramilitary communications.

## Setup

```bash
# Install dependencies
yarn install

# Start development server
yarn dev
```

## Deployment with Netlify and Cloudflare R2

This application is configured to work with Netlify for deployment and Cloudflare R2 for storing and serving the parquet data files.

### R2 Configuration

The application is configured to use the following R2 URL for the parquet file:
```
https://r2.ejfox.com/para-leaks/telegram_chats.r4.parquet
```

### Setting up Netlify

1. Create a new site in Netlify:
   - Connect to your GitHub repository
   - Use the build settings from the `netlify.toml` file

2. Configure environment variables in Netlify:
   - Go to Site settings > Environment variables
   - Add the following variable:
     - `R2_PARQUET_URL`: `https://r2.ejfox.com/para-leaks/telegram_chats.r4.parquet`

3. Deploy your site:
   - Trigger a new deployment
   - The application will fetch the parquet file from R2

### Local Development with R2

To test with R2 locally:

1. Create a `.env` file in the root of your project
2. The file should contain:
   ```
   R2_PARQUET_URL=https://r2.ejfox.com/para-leaks/telegram_chats.r4.parquet
   ```
3. Run the development server:
   ```bash
   yarn dev
   ```

### Troubleshooting R2 Issues

If you encounter the "No magic bytes found at end of file" error:

1. Check that the parquet file is accessible at the URL
2. Check the browser console for more detailed error messages

## Data Preparation

Getting data from sqlite to a csv:
```bash
sqlite3 -header -csv telegram_chats.db 'select * from messages;' > telegram_chats.csv
```

Getting data from .csv to parquet: 
```bash
duckdb -c "COPY (SELECT * FROM read_csv('telegram_chats.csv')) TO 'telegram_chats.parquet' (FORMAT PARQUET);"
```

## Data Conversion

You can create a Python script to convert the SQLite database to Parquet format:

```bash
# Install DuckDB Python package
pip install duckdb

# Run the conversion script
python3 convert_db.py
```

The script:
1. Opens the SQLite database using DuckDB's SQLite extension
2. Joins the messages table with the group_chats table
3. Maps the fields to our expected format
4. Writes the result to a Parquet file

## Features

- Interactive time-based visualization of messages
- Metadata view with statistics
- Message feed with filtering options
- Responsive design
- Color coding by chat or sender
- Tooltip displaying message details on hover
- Time annotations on the X-axis
- Legend showing chat groups

## Technologies

- Vue.js 3 with Composition API
- Nuxt 3
- DuckDB-wasm for parquet file processing
- D3.js for data visualization
- Tailwind CSS for styling
- Cloudflare R2 for data storage
- Netlify for deployment
- WebGL for 2D visualization

## Production

Build the application for production:

```bash
# yarn
yarn build
```

Locally preview production build:

```bash
# yarn
yarn preview
```

## License

MIT
