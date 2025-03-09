# Paramilitary Leaks Visualization

A visualization tool for Telegram chat data from paramilitary groups. This tool allows exploring message patterns over time.


## Data Prep
Getting data from sqlite to a csv:
`sqlite3 -header -csv telegram_chats.db 'select * from messages;' > telegram_chats.csv`

Getting data from .csv to parquet: 
`duckdb -c "COPY (SELECT * FROM read_csv('telegram_chats.csv')) TO 'telegram_chats.parquet' (FORMAT PARQUET);"`


## Current Status / Sitrep

The application loads Telegram chat data from a Parquet file (`telegram_messages.parquet`) and visualizes it in an interactive scatterplot. Each point represents a message, and the visualization shows patterns across time.

### Data Pipeline

We've successfully converted the SQLite database (`telegram_chats.db`) to a Parquet file format that can be loaded by the browser:

1. The SQLite database contains messages from multiple Telegram chats
2. We use DuckDB with the SQLite extension to:
   - Extract messages from the SQLite database
   - Join chat titles with messages
   - Convert to a compatible format for visualization
3. The data is saved as a Parquet file in the `/public` directory

### Visualization Features

- Interactive scatter plot of messages over time
- Color coding by chat or sender
- Tooltip displaying message details on hover
- Time annotations on the X-axis
- Legend showing chat groups

### Technical Stack

- Nuxt 3 framework
- DuckDB for data processing
- VueUse for state management
- 2D visualization using WebGL

## Data Conversion

We've created a Python script to convert the SQLite database to Parquet format:

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
4. Writes the result to a Parquet file in the public directory

## Setup

Make sure to install the dependencies:

```bash
# yarn
yarn install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# yarn
yarn dev
```

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

## Current Issues

- Limited number of points displayed (currently 10,000 out of ~77,000 total messages)
- Performance with large datasets
- Legends can get crowded with many chat groups
- Limited filtering options

## Next Steps

1. **Data Loading Optimization**
   - Implement virtual scrolling or progressive loading for large datasets
   - Optimize DuckDB queries

2. **UI Improvements**
   - Add more filtering options (by date range, chat group, etc.)
   - Improve legends with better categorization
   - Add search functionality

3. **Analysis Features**
   - Add timeline analysis
   - Support keyword highlighting
   - Add statistical summaries
