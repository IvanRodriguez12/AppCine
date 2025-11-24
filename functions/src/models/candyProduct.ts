// functions/src/models/candyProduct.ts

export type TipoProducto = 'promocion' | 'bebida' | 'comida' | 'otros';
export type CategoriaProducto = 'bebida' | 'comida' | 'otros';

export interface CandyProduct {
  id?: string;
  nombre: string;
  tipo: TipoProducto;
  categoria: CategoriaProducto;
  precios: { [key: string]: number };
  imageKey: string; 
  stock: number;                  
  activo: boolean;
  creadoEn: Date | FirebaseFirestore.Timestamp;
  actualizadoEn: Date | FirebaseFirestore.Timestamp;
}