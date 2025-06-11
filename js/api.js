// Perenual API Integration
const API_KEY = 'sk-PNjL67d5e53902a518589';
const API_BASE_URL = 'https://perenual.com/api';

class PlantAPI {
    constructor() {
        this.apiKey = API_KEY;
        this.cache = new Map();
    }

    async searchPlants(query, options = {}) {
        const params = new URLSearchParams({
            key: this.apiKey,
            q: query,
            page: options.page || 1,
            indoor: options.indoor || '',
            edible: options.edible || '',
            poisonous: options.poisonous || ''
        });

        const cacheKey = `search_${params.toString()}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/species-list?${params}`);
            const data = await response.json();
            this.cache.set(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Error searching plants:', error);
            return { data: [], error: error.message };
        }
    }

    async getPlantDetails(id) {
        const cacheKey = `plant_${id}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/species/details/${id}?key=${this.apiKey}`);
            const data = await response.json();
            this.cache.set(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Error fetching plant details:', error);
            return null;
        }
    }

    async getPlantCareGuide(speciesId) {
        const cacheKey = `care_${speciesId}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/species-care-guide-list?key=${this.apiKey}&species_id=${speciesId}`);
            const data = await response.json();
            if (data.data && data.data.length > 0) {
                const guideId = data.data[0].id;
                const detailsResponse = await fetch(`${API_BASE_URL}/species-care-guide-details/${guideId}?key=${this.apiKey}`);
                const details = await detailsResponse.json();
                this.cache.set(cacheKey, details);
                return details;
            }
            return null;
        } catch (error) {
            console.error('Error fetching care guide:', error);
            return null;
        }
    }

    async getPlantsByWatering(watering) {
        const params = new URLSearchParams({
            key: this.apiKey,
            watering: watering
        });

        try {
            const response = await fetch(`${API_BASE_URL}/species-list?${params}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching plants by watering:', error);
            return { data: [] };
        }
    }

    async getPlantsBySunlight(sunlight) {
        const params = new URLSearchParams({
            key: this.apiKey,
            sunlight: sunlight
        });

        try {
            const response = await fetch(`${API_BASE_URL}/species-list?${params}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching plants by sunlight:', error);
            return { data: [] };
        }
    }

    async getPlantDiseases(speciesId) {
        try {
            const response = await fetch(`${API_BASE_URL}/pest-disease-list?key=${this.apiKey}&species_id=${speciesId}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching plant diseases:', error);
            return { data: [] };
        }
    }

    async getFAQ(tag = '') {
        const params = new URLSearchParams({
            key: this.apiKey,
            tag: tag
        });

        try {
            const response = await fetch(`${API_BASE_URL}/article-faq-list?${params}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching FAQ:', error);
            return { data: [] };
        }
    }

    // Helper method to get plant image with fallback
    getPlantImage(plant, size = 'regular') {
        if (plant.default_image && plant.default_image[size]) {
            return plant.default_image[size];
        } else if (plant.default_image && plant.default_image.original_url) {
            return plant.default_image.original_url;
        }
        return 'assets/default-plant.svg';
    }

    // Helper to format plant data
    formatPlantData(plant) {
        // Handle scientific_name as array or string
        let scientificName = '';
        if (Array.isArray(plant.scientific_name)) {
            scientificName = plant.scientific_name[0] || '';
        } else if (typeof plant.scientific_name === 'string') {
            scientificName = plant.scientific_name;
        }

        // Helper function to get readable care info
        const getCareInfo = (value, defaultValue = 'Not specified') => {
            if (!value || value === 'Unknown' || value === '') return defaultValue;
            return value;
        };

        // Helper to format sunlight array
        const formatSunlight = (sunlight) => {
            if (Array.isArray(sunlight) && sunlight.length > 0) {
                return sunlight.filter(s => s && s !== 'Unknown');
            } else if (typeof sunlight === 'string' && sunlight !== 'Unknown') {
                return [sunlight];
            }
            return ['Not specified'];
        };

        return {
            id: plant.id,
            name: plant.common_name || scientificName || 'Unknown Plant',
            scientificName: scientificName,
            image: this.getPlantImage(plant),
            thumbnail: this.getPlantImage(plant, 'thumbnail'),
            cycle: getCareInfo(plant.cycle, 'Not specified'),
            watering: getCareInfo(plant.watering, 'Moderate watering'),
            sunlight: formatSunlight(plant.sunlight),
            indoor: plant.indoor || false,
            description: plant.description || '',
            careLevel: getCareInfo(plant.care_level, 'Moderate care'),
            poisonous: plant.poisonous_to_humans || plant.poisonous_to_pets || false,
            edible: plant.edible || false,
            medicinal: plant.medicinal || false,
            flowers: plant.flowers || false,
            flowerColor: plant.flower_color || null,
            growthRate: getCareInfo(plant.growth_rate, 'Moderate growth'),
            drought_tolerant: plant.drought_tolerant || false,
            salt_tolerant: plant.salt_tolerant || false,
            thorny: plant.thorny || false,
            invasive: plant.invasive || false,
            tropical: plant.tropical || false,
            cuisine: plant.cuisine || false,
            leaf_color: plant.leaf_color || [],
            pest_susceptibility: plant.pest_susceptibility || [],
            attracts: plant.attracts || []
        };
    }
}

// Export API instance
const plantAPI = new PlantAPI();