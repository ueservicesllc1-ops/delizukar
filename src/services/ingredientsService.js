import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Servicio para manejar ingredientes en Firestore
 */
export class IngredientsService {
  
  /**
   * Obtener todos los ingredientes
   * @returns {Promise<Array>} Lista de ingredientes
   */
  static async getAllIngredients() {
    try {
      console.log('🔄 Obteniendo ingredientes desde Firestore...');
      
      const ingredientsRef = collection(db, 'ingredients');
      const q = query(ingredientsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const ingredientsList = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        ingredientsList.push({
          id: doc.id,
          ...data,
          // Asegurar que los campos numéricos estén bien formateados
          price: parseFloat(data.price) || 0,
          stock: parseFloat(data.stock) || 0,
          minStock: parseFloat(data.minStock) || 0
        });
      });
      
      console.log(`✅ Obtenidos ${ingredientsList.length} ingredientes desde Firestore`);
      return ingredientsList;
      
    } catch (error) {
      console.error('❌ Error obteniendo ingredientes:', error);
      throw new Error(`Error al obtener ingredientes: ${error.message}`);
    }
  }

  /**
   * Obtener ingrediente por ID
   * @param {string} ingredientId - ID del ingrediente
   * @returns {Promise<Object>} Datos del ingrediente
   */
  static async getIngredientById(ingredientId) {
    try {
      console.log('🔄 Obteniendo ingrediente por ID:', ingredientId);
      
      const ingredientsRef = collection(db, 'ingredients');
      const q = query(ingredientsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      let ingredient = null;
      querySnapshot.forEach((doc) => {
        if (doc.id === ingredientId) {
          const data = doc.data();
          ingredient = {
            id: doc.id,
            ...data,
            price: parseFloat(data.price) || 0,
            stock: parseFloat(data.stock) || 0,
            minStock: parseFloat(data.minStock) || 0
          };
        }
      });
      
      if (ingredient) {
        console.log('✅ Ingrediente encontrado:', ingredient.name);
      } else {
        console.log('⚠️ Ingrediente no encontrado');
      }
      
      return ingredient;
      
    } catch (error) {
      console.error('❌ Error obteniendo ingrediente por ID:', error);
      throw new Error(`Error al obtener ingrediente: ${error.message}`);
    }
  }

  /**
   * Obtener ingredientes por categoría
   * @param {string} category - Categoría del ingrediente
   * @returns {Promise<Array>} Lista de ingredientes filtrados
   */
  static async getIngredientsByCategory(category) {
    try {
      console.log('🔄 Obteniendo ingredientes por categoría:', category);
      
      const allIngredients = await this.getAllIngredients();
      const filteredIngredients = allIngredients.filter(ingredient => 
        ingredient.category === category
      );
      
      console.log(`✅ Encontrados ${filteredIngredients.length} ingredientes en la categoría ${category}`);
      return filteredIngredients;
      
    } catch (error) {
      console.error('❌ Error obteniendo ingredientes por categoría:', error);
      throw new Error(`Error al obtener ingredientes por categoría: ${error.message}`);
    }
  }

  /**
   * Buscar ingredientes por nombre
   * @param {string} searchTerm - Término de búsqueda
   * @returns {Promise<Array>} Lista de ingredientes que coinciden
   */
  static async searchIngredients(searchTerm) {
    try {
      console.log('🔄 Buscando ingredientes:', searchTerm);
      
      const allIngredients = await this.getAllIngredients();
      const searchResults = allIngredients.filter(ingredient => 
        ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ingredient.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ingredient.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      console.log(`✅ Encontrados ${searchResults.length} ingredientes que coinciden con "${searchTerm}"`);
      return searchResults;
      
    } catch (error) {
      console.error('❌ Error buscando ingredientes:', error);
      throw new Error(`Error al buscar ingredientes: ${error.message}`);
    }
  }

  /**
   * Obtener ingredientes con stock bajo
   * @returns {Promise<Array>} Lista de ingredientes con stock bajo
   */
  static async getLowStockIngredients() {
    try {
      console.log('🔄 Obteniendo ingredientes con stock bajo...');
      
      const allIngredients = await this.getAllIngredients();
      const lowStockIngredients = allIngredients.filter(ingredient => 
        ingredient.stock <= ingredient.minStock
      );
      
      console.log(`✅ Encontrados ${lowStockIngredients.length} ingredientes con stock bajo`);
      return lowStockIngredients;
      
    } catch (error) {
      console.error('❌ Error obteniendo ingredientes con stock bajo:', error);
      throw new Error(`Error al obtener ingredientes con stock bajo: ${error.message}`);
    }
  }

  /**
   * Crear nuevo ingrediente
   * @param {Object} ingredientData - Datos del ingrediente
   * @returns {Promise<string>} ID del ingrediente creado
   */
  static async createIngredient(ingredientData) {
    try {
      console.log('🔄 Creando nuevo ingrediente:', ingredientData.name);
      
      const ingredientsRef = collection(db, 'ingredients');
      const docRef = await addDoc(ingredientsRef, {
        ...ingredientData,
        name: ingredientData.name.trim(),
        price: parseFloat(ingredientData.price) || 0,
        unit: ingredientData.unit || 'kg',
        category: ingredientData.category || 'materia_prima',
        description: ingredientData.description || '',
        image: ingredientData.image || '',
        supplier: ingredientData.supplier || '',
        stock: parseFloat(ingredientData.stock) || 0,
        minStock: parseFloat(ingredientData.minStock) || 0,
        createdAt: new Date().toISOString(),
        addedBy: 'admin'
      });

      console.log('✅ Ingrediente creado exitosamente con ID:', docRef.id);
      return docRef.id;
      
    } catch (error) {
      console.error('❌ Error creando ingrediente:', error);
      throw new Error(`Error al crear ingrediente: ${error.message}`);
    }
  }

  /**
   * Actualizar ingrediente
   * @param {string} ingredientId - ID del ingrediente
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<void>}
   */
  static async updateIngredient(ingredientId, updateData) {
    try {
      console.log('🔄 Actualizando ingrediente:', ingredientId);
      
      const ingredientRef = doc(db, 'ingredients', ingredientId);
      await updateDoc(ingredientRef, {
        ...updateData,
        name: updateData.name?.trim() || updateData.name,
        price: updateData.price ? parseFloat(updateData.price) : updateData.price,
        stock: updateData.stock ? parseFloat(updateData.stock) : updateData.stock,
        minStock: updateData.minStock ? parseFloat(updateData.minStock) : updateData.minStock,
        updatedAt: new Date().toISOString()
      });

      console.log('✅ Ingrediente actualizado exitosamente');
      
    } catch (error) {
      console.error('❌ Error actualizando ingrediente:', error);
      throw new Error(`Error al actualizar ingrediente: ${error.message}`);
    }
  }

  /**
   * Eliminar ingrediente
   * @param {string} ingredientId - ID del ingrediente
   * @returns {Promise<void>}
   */
  static async deleteIngredient(ingredientId) {
    try {
      console.log('🔄 Eliminando ingrediente:', ingredientId);
      
      await deleteDoc(doc(db, 'ingredients', ingredientId));
      console.log('✅ Ingrediente eliminado exitosamente');
      
    } catch (error) {
      console.error('❌ Error eliminando ingrediente:', error);
      throw new Error(`Error al eliminar ingrediente: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de ingredientes
   * @returns {Promise<Object>} Estadísticas de ingredientes
   */
  static async getIngredientsStats() {
    try {
      console.log('🔄 Obteniendo estadísticas de ingredientes...');
      
      const allIngredients = await this.getAllIngredients();
      
      const stats = {
        total: allIngredients.length,
        byCategory: {},
        lowStock: 0,
        totalValue: 0,
        averagePrice: 0
      };

      // Calcular estadísticas por categoría
      allIngredients.forEach(ingredient => {
        const category = ingredient.category || 'otros';
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
        
        // Contar stock bajo
        if (ingredient.stock <= ingredient.minStock) {
          stats.lowStock++;
        }
        
        // Calcular valor total
        stats.totalValue += ingredient.price * ingredient.stock;
      });

      // Calcular precio promedio
      stats.averagePrice = stats.total > 0 ? stats.totalValue / stats.total : 0;

      console.log('✅ Estadísticas calculadas:', stats);
      return stats;
      
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }
}

export default IngredientsService;
