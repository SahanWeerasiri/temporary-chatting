
const fs = require('fs').promises;
const path = require('path');

class FileStorage {
    constructor(filePath) {
        this.filePath = filePath;
    }

    async read() {
        try {
            const data = await fs.readFile(this.filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }

    async write(data) {
        await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf8');
    }

    async findOne(query) {
        const data = await this.read();
        return data.find(item => {
            for (const key in query) {
                if (item[key] !== query[key]) return false;
            }
            return true;
        });
    }

    async find(query = {}) {
        const data = await this.read();
        if (Object.keys(query).length === 0) return data;

        return data.filter(item => {
            for (const key in query) {
                if (item[key] !== query[key]) return false;
            }
            return true;
        });
    }

    async insert(item) {
        const data = await this.read();
        data.push(item);
        await this.write(data);
        return item;
    }

    async update(query, updates) {
        const data = await this.read();
        const index = data.findIndex(item => {
            for (const key in query) {
                if (item[key] !== query[key]) return false;
            }
            return true;
        });

        if (index !== -1) {
            data[index] = { ...data[index], ...updates };
            await this.write(data);
            return data[index];
        }
        return null;
    }

    async delete(query) {
        const data = await this.read();
        const filteredData = data.filter(item => {
            for (const key in query) {
                if (item[key] !== query[key]) return false;
            }
            return true;
        });

        await this.write(filteredData);
        return filteredData.length !== data.length;
    }
}

module.exports = FileStorage;