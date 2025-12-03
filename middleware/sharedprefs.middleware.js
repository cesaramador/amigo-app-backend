// sharedPrefs.js
import SharedPreferences from 'react-native-shared-preferences';

const SharedPrefs = {
    set: async (key, value) => {
        try {
            await SharedPreferences.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error guardando SharedPreferences(${key}):`, error);
            return false;
        }
    },

    get: async (key) => {
        try {
            const raw = await SharedPreferences.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            console.error(`Error obteniendo SharedPreferences(${key}):`, error);
            return null;
        }
    },

    remove: async (key) => {
        try {
            await SharedPreferences.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error eliminando SharedPreferences(${key}):`, error);
            return false;
        }
    }
};

export default SharedPrefs;
