import React, { createContext, useContext, useState } from "react";

export type FavouriteItem = {
  id: string;
  venueName: string;
  spaceName: string;
  location: string;
  pricePerHour: number;
};

type FavouritesContextType = {
  favourites: FavouriteItem[];
  toggleFavourite: (item: FavouriteItem) => void;
  isFavourite: (id: string) => boolean;
};

const FavouritesContext = createContext<FavouritesContextType>({
  favourites: [],
  toggleFavourite: () => {},
  isFavourite: () => false,
});

export const FavouritesProvider = ({ children }: { children: React.ReactNode }) => {
  const [favourites, setFavourites] = useState<FavouriteItem[]>([]);

  const toggleFavourite = (item: FavouriteItem) => {
    setFavourites((prev) =>
      prev.find((f) => f.id === item.id)
        ? prev.filter((f) => f.id !== item.id)
        : [...prev, item]
    );
  };

  const isFavourite = (id: string) => favourites.some((f) => f.id === id);

  return (
    <FavouritesContext.Provider value={{ favourites, toggleFavourite, isFavourite }}>
      {children}
    </FavouritesContext.Provider>
  );
};

export const useFavourites = () => useContext(FavouritesContext);
