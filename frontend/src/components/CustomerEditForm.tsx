import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { useForm } from "react-hook-form";
import { useCreateCustomer, useUpdateCustomer } from "../hooks/useCustomers";
import { customerFormSchema, type CustomerFormValues } from "../schemas/customer";
import type { Customer } from "../types/customer";

interface CustomerEditFormProps {
  customer?: Customer;
  onCancel: () => void;
  onSaved: () => void;
}

export function CustomerEditForm({ customer, onCancel, onSaved }: CustomerEditFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      first_name: customer?.first_name ?? "",
      last_name: customer?.last_name ?? "",
      email: customer?.email ?? "",
      phone_number: customer?.phone_number ?? "",
    },
  });

  const updateMutation = useUpdateCustomer();
  const createMutation = useCreateCustomer();
  const updateCustomer = customer ? updateMutation : createMutation;

  const onSubmit = async (values: CustomerFormValues) => {
    try {
      if (customer) {
        await updateMutation.mutateAsync({ id: customer.id, data: values });
      } else {
        await createMutation.mutateAsync(values);
      }
      onSaved();
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 400) {
        const fieldErrors = error.response.data as Record<string, string[]>;
        for (const [field, messages] of Object.entries(fieldErrors)) {
          if (field in customerFormSchema.shape) {
            setError(field as keyof CustomerFormValues, {
              type: "server",
              message: messages.join(" "),
            });
          }
        }
      }
    }
  };

  const isServerError =
    updateCustomer.isError &&
    !(isAxiosError(updateCustomer.error) && updateCustomer.error.response?.status === 400);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">First name</label>
        <input {...register("first_name")} className="w-full rounded border border-gray-300 px-3 py-2" />
        {errors.first_name && <p className="text-sm text-red-600">{errors.first_name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium">Last name</label>
        <input {...register("last_name")} className="w-full rounded border border-gray-300 px-3 py-2" />
        {errors.last_name && <p className="text-sm text-red-600">{errors.last_name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium">Email</label>
        <input {...register("email")} className="w-full rounded border border-gray-300 px-3 py-2" />
        {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium">Phone number</label>
        <input {...register("phone_number")} className="w-full rounded border border-gray-300 px-3 py-2" />
        {errors.phone_number && <p className="text-sm text-red-600">{errors.phone_number.message}</p>}
      </div>

      {isServerError && <p className="text-sm text-red-600">Failed to save changes. Please try again.</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting || updateCustomer.isPending}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {updateCustomer.isPending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={updateCustomer.isPending}
          className="rounded border border-gray-300 px-4 py-2 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
