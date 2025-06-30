import React, { createContext, ReactNode, useContext, useReducer } from 'react';

export interface ItemCarrito {
  id: string;
  nombre: string;
  tipo: string;
  imagen: any;
  precios: { [key: string]: number };
  categoria: string;
  tamanio: string;
  precio: number;
  cantidad: number;
}

interface CarritoState {
  items: ItemCarrito[];
}

type CarritoAction =
  | { type: 'AGREGAR_ITEM'; payload: ItemCarrito }
  | { type: 'INCREMENTAR_CANTIDAD'; payload: { productKey: string } }
  | { type: 'DECREMENTAR_CANTIDAD'; payload: { productKey: string } }
  | { type: 'ELIMINAR_ITEM'; payload: { productKey: string } }
  | { type: 'LIMPIAR_CARRITO' }
  | { type: 'ACTUALIZAR_CANTIDAD'; payload: { productKey: string; cantidad: number } };

interface CarritoContextType {
  state: CarritoState;
  agregarItem: (item: ItemCarrito) => void;
  incrementarCantidad: (productKey: string) => void;
  decrementarCantidad: (productKey: string) => void;
  eliminarItem: (productKey: string) => void;
  limpiarCarrito: () => void;
  actualizarCantidad: (productKey: string, cantidad: number) => void;
  getProductKey: (producto: any, tamanio: string) => string;
  getItemByKey: (productKey: string) => ItemCarrito | undefined;
  getTotalItems: () => number;
  getTotalPrecio: () => number;
}

export const getProductKey = (producto: any, tamanio: string) => {
  return `${producto.id}_${tamanio}`;
};

const carritoReducer = (state: CarritoState, action: CarritoAction): CarritoState => {
  switch (action.type) {
    case 'AGREGAR_ITEM': {
      const productKey = getProductKey(action.payload, action.payload.tamanio);
      const existingIndex = state.items.findIndex(item => 
        getProductKey(item, item.tamanio) === productKey
      );

      if (existingIndex >= 0) {
        const newItems = [...state.items];
        newItems[existingIndex].cantidad += action.payload.cantidad;
        return { ...state, items: newItems };
      } else {
        return { ...state, items: [...state.items, action.payload] };
      }
    }

    case 'INCREMENTAR_CANTIDAD': {
      return {
        ...state,
        items: state.items.map(item =>
          getProductKey(item, item.tamanio) === action.payload.productKey
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      };
    }

    case 'DECREMENTAR_CANTIDAD': {
      return {
        ...state,
        items: state.items
          .map(item =>
            getProductKey(item, item.tamanio) === action.payload.productKey
              ? { ...item, cantidad: item.cantidad - 1 }
              : item
          )
          .filter(item => item.cantidad > 0)
      };
    }

    case 'ELIMINAR_ITEM': {
      return {
        ...state,
        items: state.items.filter(item => 
          getProductKey(item, item.tamanio) !== action.payload.productKey
        )
      };
    }

    case 'ACTUALIZAR_CANTIDAD': {
      if (action.payload.cantidad <= 0) {
        return {
          ...state,
          items: state.items.filter(item => 
            getProductKey(item, item.tamanio) !== action.payload.productKey
          )
        };
      }
      
      return {
        ...state,
        items: state.items.map(item =>
          getProductKey(item, item.tamanio) === action.payload.productKey
            ? { ...item, cantidad: action.payload.cantidad }
            : item
        )
      };
    }

    case 'LIMPIAR_CARRITO': {
      return { ...state, items: [] };
    }

    default:
      return state;
  }
};

const CarritoContext = createContext<CarritoContextType | undefined>(undefined);

interface CarritoProviderProps {
  children: ReactNode;
}

export const CarritoProvider: React.FC<CarritoProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(carritoReducer, { items: [] });

  const agregarItem = (item: ItemCarrito) => {
    dispatch({ type: 'AGREGAR_ITEM', payload: item });
  };

  const incrementarCantidad = (productKey: string) => {
    dispatch({ type: 'INCREMENTAR_CANTIDAD', payload: { productKey } });
  };

  const decrementarCantidad = (productKey: string) => {
    dispatch({ type: 'DECREMENTAR_CANTIDAD', payload: { productKey } });
  };

  const eliminarItem = (productKey: string) => {
    dispatch({ type: 'ELIMINAR_ITEM', payload: { productKey } });
  };

  const limpiarCarrito = () => {
    dispatch({ type: 'LIMPIAR_CARRITO' });
  };

  const actualizarCantidad = (productKey: string, cantidad: number) => {
    dispatch({ type: 'ACTUALIZAR_CANTIDAD', payload: { productKey, cantidad } });
  };

  const getItemByKey = (productKey: string) => {
    return state.items.find(item => getProductKey(item, item.tamanio) === productKey);
  };

  const getTotalItems = () => {
    return state.items.reduce((total, item) => total + item.cantidad, 0);
  };

  const getTotalPrecio = () => {
    return state.items.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  };

  const value: CarritoContextType = {
    state,
    agregarItem,
    incrementarCantidad,
    decrementarCantidad,
    eliminarItem,
    limpiarCarrito,
    actualizarCantidad,
    getProductKey,
    getItemByKey,
    getTotalItems,
    getTotalPrecio,
  };

  return (
    <CarritoContext.Provider value={value}>
      {children}
    </CarritoContext.Provider>
  );
};

export const useCarrito = () => {
  const context = useContext(CarritoContext);
  if (context === undefined) {
    throw new Error('useCarrito debe ser usado dentro de un CarritoProvider');
  }
  return context;
};