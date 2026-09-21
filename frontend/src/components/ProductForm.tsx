import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { useForm } from "react-hook-form";
import { useCreateProduct, useUpdateProduct } from "../hooks/useProducts";
import { productFormSchema, type ProductFormValues } from "../schemas/product";
import { PRODUCT_CATEGORIES, type Product } from "../types/product";

interface ProductFormProps {
  product?: Product;
  onCancel: () => void;
  onSaved: () => void;
}

const inputClass = "w-full rounded border border-gray-300 px-3 py-2";

export function ProductForm({ product, onCancel, onSaved }: ProductFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name ?? "",
      brand: product?.brand ?? "",
      category: product?.category ?? "skincare",
      description: product?.description ?? "",
      price: product?.price ?? "",
      stock: String(product?.stock ?? 0),
      image_url: product?.image_url ?? "",
      is_active: product?.is_active ?? true,
    },
  });

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const mutation = product ? updateMutation : createMutation;

  const onSubmit = async (values: ProductFormValues) => {
    const payload = { ...values, stock: Number(values.stock) };
    try {
      if (product) {
        await updateMutation.mutateAsync({ id: product.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onSaved();
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 400) {
        const fieldErrors = error.response.data as Record<string, string[]>;
        for (const [field, messages] of Object.entries(fieldErrors)) {
          if (field in productFormSchema.shape) {
            setError(field as keyof ProductFormValues, { type: "server", message: messages.join(" ") });
          }
        }
      }
    }
  };

  const isServerError =
    mutation.isError && !(isAxiosError(mutation.error) && mutation.error.response?.status === 400);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Name</label>
        <input {...register("name")} className={inputClass} />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium">Brand</label>
        <input {...register("brand")} className={inputClass} />
        {errors.brand && <p className="text-sm text-red-600">{errors.brand.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium">Category</label>
        <select {...register("category")} className={`${inputClass} capitalize`}>
          {PRODUCT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Price ($)</label>
          <input {...register("price")} inputMode="decimal" className={inputClass} />
          {errors.price && <p className="text-sm text-red-600">{errors.price.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Stock</label>
          <input {...register("stock")} inputMode="numeric" className={inputClass} />
          {errors.stock && <p className="text-sm text-red-600">{errors.stock.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Description</label>
        <textarea {...register("description")} rows={3} className={inputClass} />
      </div>

      <div>
        <label className="block text-sm font-medium">Image URL</label>
        <input {...register("image_url")} className={inputClass} />
        {errors.image_url && <p className="text-sm text-red-600">{errors.image_url.message}</p>}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register("is_active")} />
        Active (visible in catalog)
      </label>

      {isServerError && <p className="text-sm text-red-600">Failed to save. Please try again.</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting || mutation.isPending}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {mutation.isPending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={mutation.isPending}
          className="rounded border border-gray-300 px-4 py-2 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
