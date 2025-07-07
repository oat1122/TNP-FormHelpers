import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateMaxSupply } from '../../features/MaxSupply/maxSupplyApi';
import FileUpload from './FileUpload';

const schema = z.object({
  worksheet_id: z.string(),
  title: z.string().min(1)
});

const MaxSupplyForm = () => {
  const { register, handleSubmit, reset } = useForm({
    resolver: zodResolver(schema)
  });
  const create = useCreateMaxSupply();

  const onSubmit = (data) => {
    create.mutate(data, { onSuccess: () => reset() });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      <input {...register('worksheet_id')} placeholder="Worksheet ID" className="border p-1" />
      <input {...register('title')} placeholder="Title" className="border p-1" />
      <FileUpload />
      <button type="submit" className="px-2 py-1 bg-blue-500 text-white">Save</button>
    </form>
  );
};

export default MaxSupplyForm;
