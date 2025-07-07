import React from 'react';
import { useMaxSupplies } from '../../features/MaxSupply/maxSupplyApi';
import useMaxSupplyStore from '../../features/MaxSupply/maxSupplySlice';

const MaxSupplyList = () => {
  const { data, isLoading } = useMaxSupplies();
  const setSelected = useMaxSupplyStore((s) => s.setSelected);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-xl mb-2">Max Supply</h2>
      <ul>
        {data?.map((item) => (
          <li key={item.id} onClick={() => setSelected(item)} className="cursor-pointer">
            {item.title}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MaxSupplyList;
