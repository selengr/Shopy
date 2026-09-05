"use client";

import { withFormik } from "formik";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import * as yup from "yup";
import type { KeyedMutator } from "swr";
import InnerProductForm from "@/components/admin/products/innerProductForm";
import { CreateProductInterface, variantsFromProduct } from "@/contracts/admin/products";
import ValidationError, {
  applyFieldErrors,
} from "@/exceptions/validationError";
import Product from "@/models/product";
import { UpdateProduct } from "@/services/product";

interface ProductFormProps {
  product: Product;
  mutateProducts?: KeyedMutator<{
    products: Product[];
    total_page: number;
  }>;
  router: ReturnType<typeof useRouter>;
}

const FormikEditProductForm = withFormik<ProductFormProps, CreateProductInterface>(
  {
    mapPropsToValues: ({ product }) => ({
      title: product.title,
      title_en: product.title_en ?? "",
      category_id: product.category ?? "",
      price: product.price,
      compareAtPrice: product.compareAtPrice ?? "",
      description: product.body,
      body_en: product.body_en ?? "",
      stock: product.stock ?? 0,
      emoji: product.emoji ?? "📦",
      image: product.image ?? product.images?.[0] ?? "",
      images:
        product.images?.length
          ? product.images
          : product.image
            ? [product.image]
            : [],
      variants: variantsFromProduct(product.variants),
      featured: Boolean(product.featured),
    }),
    validationSchema: yup.object({
      title: yup.string().required("عنوان الزامی است").min(4).max(255),
      title_en: yup.string().max(255),
      category_id: yup.string().required("دسته‌بندی الزامی است"),
      price: yup.number().min(0),
      compareAtPrice: yup
        .mixed()
        .test("compare", "قیمت قبلی باید از قیمت فروش بیشتر باشد", function (value) {
          if (value === "" || value === null || value === undefined) return true;
          const compare = Number(value);
          if (!Number.isFinite(compare) || compare <= 0) return true;
          return compare > Number(this.parent.price);
        }),
      description: yup.string().required("توضیحات الزامی است").min(4).max(6000),
      body_en: yup.string().max(6000),
      stock: yup.number().min(0).required("موجودی الزامی است"),
      emoji: yup.string().required(),
      image: yup.string(),
      images: yup.array().of(yup.string()),
    }),
    handleSubmit: async (values, { props, setFieldError }) => {
      try {
        await UpdateProduct(props.product.id, values);
        await props.mutateProducts?.();
        props.router.push("/admin/products");
        toast.success("محصول مورد نظر با موفقیت ویرایش شد");
      } catch (error) {
        if (error instanceof ValidationError) {
          applyFieldErrors(error.messages, setFieldError);
          return;
        }

        toast.error("متاسفانه مشکلی در ویرایش محصول وجود دارد.");
      }
    },
  },
)(InnerProductForm);

export default function EditProductForm(
  props: Omit<ProductFormProps, "router">,
) {
  const router = useRouter();
  return <FormikEditProductForm {...props} router={router} />;
}
