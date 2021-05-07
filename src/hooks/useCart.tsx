import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');
    
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });
  // const [stock, setStock] = useState<Stock[]>([])

  // useEffect(() => {
  //   api.get('/stock')
  //     .then(response => setStock(response.data))
  // }, []);

  const addProduct = async (productId: number) => {
    try {
      const stockResponse = await api.get<Stock>(`/stock/${productId}`)
      const productStock = stockResponse.data

      const updatedCart = [...cart]

      const productCart = updatedCart.find(product => product.id === productId)
      
      const productAmount = productCart ? productCart.amount : 0;
      const amount = productAmount + 1

      if (amount > productStock.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productCart){
        productCart.amount = amount // it also changes the updatedCart

      } else{
        const productsResponse = await api.get<Product>(`/products/${productId}`)
        const product = productsResponse.data

        const newProduct = {
          ...product,
          amount: 1,
        };

        updatedCart.push(newProduct);
      }

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart] // makes a copy of 'cart'

      const productIndex = updatedCart.findIndex(product => product.id === productId) // return -1 if not find the product
      
      if (productIndex >= 0){
        updatedCart.splice(productIndex, 1) // removes the element

        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));

      } else {
        throw Error(); // It goes to catch
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const stockResponse = await api.get<Stock>(`/stock/${productId}`)
      const productStock = stockResponse.data

      const updatedCart = [...cart]

      const productCart = updatedCart.find(product => product.id === productId)

      if (amount > productStock.amount ||  amount <= 0) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productCart){
        productCart.amount = amount
      } else{
        throw Error();
      }

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
