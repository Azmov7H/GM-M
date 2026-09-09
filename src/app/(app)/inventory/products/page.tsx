import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { listProducts } from "@/server/services/product.service";
import { listCategories } from "@/server/services/category.service";
import { listUnits } from "@/server/services/unit.service";
import { ProductsManager } from "@/components/inventory/products-manager";
import { CategoriesManager } from "@/components/inventory/categories-manager";
import { UnitsManager } from "@/components/inventory/units-manager";
import { PageError } from "@/components/shared/page-error";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function ProductsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!hasPermission(user.permissions, "products:read")) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">المنتجات</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            إدارة المنتجات والفئات والوحدات
          </p>
        </div>
        <PageError
          title="صلاحية غير كافية"
          description="تحتاج إلى صلاحية عرض المنتجات للوصول إلى هذه الصفحة."
        />
      </div>
    );
  }

  const [products, categories, units] = await Promise.all([
    listProducts(),
    listCategories(),
    listUnits(),
  ]);

  const canCreate = hasPermission(user.permissions, "products:create");
  const canUpdate = hasPermission(user.permissions, "products:update");
  const canDelete = hasPermission(user.permissions, "products:delete");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">المنتجات</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          إدارة المنتجات والفئات والوحدات
        </p>
      </div>
      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">المنتجات</TabsTrigger>
          <TabsTrigger value="categories">الفئات</TabsTrigger>
          <TabsTrigger value="units">الوحدات</TabsTrigger>
        </TabsList>
        <TabsContent value="products">
          <ProductsManager
            initialProducts={products}
            categories={categories}
            units={units}
            canCreate={canCreate}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesManager
            initialCategories={categories}
            canManage={canCreate || canUpdate}
          />
        </TabsContent>
        <TabsContent value="units">
          <UnitsManager initialUnits={units} canManage={canCreate || canUpdate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
