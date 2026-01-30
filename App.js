export default {
  data() {
    return {
      csvFiles: [],
      selectedFile: '',
      csvData: {},
      decklist: '',
      results: null,
      loading: false,
      error: '',
    };
  },
  mounted() {
    this.fetchCsvFiles();
  },
  methods: {
    async fetchCsvFiles() {
      // Fetch the list of CSV files from the generated manifest
      try {
        const res = await fetch('./data_files/index.json');
        if (!res.ok) throw new Error('Could not load data_files/index.json');
        this.csvFiles = await res.json();
      } catch (e) {
        this.csvFiles = [];
        this.error = 'Could not load CSV file list.';
      }
    },
    async loadCsv() {
      if (!this.selectedFile) return;
      this.loading = true;
      this.error = '';
      try {
        const res = await fetch(`./data_files/${this.selectedFile}`);
        if (!res.ok) throw new Error('Failed to load CSV');
        const text = await res.text();
        this.csvData = this.parseCsv(text);
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },
    parseCsv(text) {
      const lines = text.split(/\r?\n/);
      const headers = lines[0].split(',');
      const nameIdx = headers.findIndex(h => h.toLowerCase() === 'name');
      const legalityIdx = headers.findIndex(h => h.toLowerCase() === 'legality');
      const oracleIdx = headers.findIndex(h => h.toLowerCase() === 'oracle id');
      const data = {};
      for (let i = 1; i < lines.length; i++) {
        const row = this.parseCsvRow(lines[i]);
        if (row.length < Math.max(nameIdx, legalityIdx, oracleIdx) + 1) continue;
        // Remove external quotes if present
        const name = row[nameIdx]?.trim().replace(/^"|"$/g, '');
        if (!name) continue;
        data[name.toLowerCase()] = {
          legality: row[legalityIdx]?.trim().replace(/^"|"$/g, ''),
          oracle_id: row[oracleIdx]?.trim().replace(/^"|"$/g, ''),
        };
      }
      return data;
    },
    // Simple CSV row parser that handles quoted fields with commas
    parseCsvRow(line) {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i+1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current);
      return result;
    },
    checkLegality() {
      if (!this.decklist || !this.csvData) return;
      const lines = this.decklist.split(/\r?\n/);
      // Remove sideboard and commander
      let main = [];
      let foundSideboard = false;
      for (let line of lines) {
        if (/^sideboard[:]?/i.test(line)) {
          foundSideboard = true;
          continue;
        }
        if (foundSideboard) continue;
        if (line.trim() === '') continue;
        main.push(line);
      }
      // Remove last non-empty line (commander)
      while (main.length && main[main.length-1].trim() === '') main.pop();
      if (main.length) main.pop();
      // Parse card names
      const cards = main.map(l => l.replace(/^\d+x?\s+/i, '').trim()).filter(Boolean);
      const illegal = [];
      for (let card of cards) {
        const entry = this.csvData[card.toLowerCase()];
        if (!entry) {
          illegal.push({ name: card, reason: 'card not found', oracle_id: null });
        } else if (entry.legality !== 'Legal') {
          illegal.push({ name: card, reason: entry.legality, oracle_id: entry.oracle_id });
        }
      }
      this.results = illegal.length === 0 ? 'all legal' : illegal;
    },
    scryfallUrl(oracle_id) {
      return `https://scryfall.com/search?q=oracleid%3A${oracle_id}`;
    },
  },
  template: `
    <div class="container">
      <h1>MTG Bulk Legality Checker</h1>
      <div class="instructions">
        <strong>How to get your decklist from Moxfield:</strong>
        <ol>
          <li>Enter your decklist into Moxfield</li>
          <li>Click <b>More</b></li>
          <li>Click <b>Export</b></li>
          <li>Click <b>Copy Plain Text</b></li>
          <li>Paste it as is in the box below</li>
        </ol>
      </div>
      <div class="section">
        <label for="csv">Select Data File:</label>
        <select v-model="selectedFile" @change="loadCsv">
          <option value="" disabled>Select a file</option>
          <option v-for="f in csvFiles" :key="f" :value="f">{{ f }}</option>
        </select>
      </div>
      <div class="section">
        <label for="decklist">Paste Decklist:</label>
        <textarea v-model="decklist" rows="15" placeholder="Paste your decklist here..."></textarea>
      </div>
      <button :disabled="!selectedFile || !decklist || loading" @click="checkLegality">Check Legality</button>
      <div v-if="loading">Loading data...</div>
      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="results">
        <div v-if="results === 'all legal'" class="legal">All legal</div>
        <div v-else>
          <h2>Illegal Cards</h2>
          <ul>
            <li v-for="c in results" :key="c.name">
              <span v-if="c.oracle_id">
                <a :href="scryfallUrl(c.oracle_id)" target="_blank">{{ c.name }}</a>
              </span>
              <span v-else>{{ c.name }}</span>
              <span class="reason">({{ c.reason }})</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  `,
};
