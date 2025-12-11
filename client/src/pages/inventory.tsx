import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { BackgroundPattern } from "@/components/background-pattern";
import { StatCard } from "@/components/stat-card";
import { SearchBar } from "@/components/search-bar";
import { StatusPill } from "@/components/status-pill";
import { LoadingSpinner } from "@/components/loading-spinner";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import {
  Package,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Plus,
  Download,
  RefreshCw,
  Edit2,
  Trash2,
} from "lucide-react";
import type { InventoryItem, InventoryStats } from "@shared/schema";

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const {
    data: items = [],
    isLoading,
    refetch,
  } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  const stats: InventoryStats = {
    totalItems: items.length,
    inStock: items.filter((i) => i.itemStatus === "In Stock").length,
    lowStock: items.filter((i) => i.itemStatus === "Low Stock").length,
    outOfStock: items.filter((i) => i.itemStatus === "Out of Stock").length,
  };

  const categories = [...new Set(items.map((i) => i.itemCategory))];

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemLocation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || item.itemCategory === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#1A1E32" }}
    >
      <BackgroundPattern />
      <Header title="SUPPLY INVENTORY" showBack />

      <main className="flex-1 relative z-10 px-4 md:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div
            className="rounded-3xl p-6 md:p-8"
            style={{
              background: "rgba(14, 33, 72, 0.85)",
              backdropFilter: "blur(25px)",
              border: "1px solid rgba(121, 101, 193, 0.4)",
              boxShadow: "0 12px 40px rgba(0, 0, 0, 0.3)",
            }}
          >
            <div
              className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8 pb-6 border-b-2"
              style={{ borderColor: "rgba(121, 101, 193, 0.4)" }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #00A38D, #00A38DCC)",
                  }}
                >
                  <Package className="w-6 h-6 text-white" />
                </div>
                <h2
                  className="text-2xl md:text-3xl font-extrabold"
                  style={{
                    color: "#E3D095",
                    textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
                  }}
                  data-testid="text-inventory-title"
                >
                  Supply Inventory
                </h2>
              </div>
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search items by name, description, or location..."
              />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={Package}
                value={stats.totalItems}
                label="Total Items"
                color="#007BFF"
                loading={isLoading}
              />
              <StatCard
                icon={CheckCircle}
                value={stats.inStock}
                label="In Stock"
                color="#28A745"
                loading={isLoading}
              />
              <StatCard
                icon={AlertTriangle}
                value={stats.lowStock}
                label="Low Stock"
                color="#FFC107"
                loading={isLoading}
              />
              <StatCard
                icon={XCircle}
                value={stats.outOfStock}
                label="Out of Stock"
                color="#DC3545"
                loading={isLoading}
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 rounded-lg text-sm font-medium outline-none"
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    color: "#E3D095",
                    border: "1px solid rgba(121, 101, 193, 0.4)",
                  }}
                  data-testid="select-category"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  className="rounded-lg px-4 gap-2"
                  style={{ background: "#00A38D", color: "white" }}
                  data-testid="button-add-item"
                >
                  <Plus className="w-4 h-4" />
                  Add Item
                </Button>
                <Button
                  variant="outline"
                  className="rounded-lg px-4 gap-2 border-[rgba(121,101,193,0.4)]"
                  style={{ color: "#E3D095" }}
                  data-testid="button-export"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-lg border-[rgba(121,101,193,0.4)]"
                  style={{ color: "#E3D095" }}
                  onClick={() => refetch()}
                  data-testid="button-refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {isLoading ? (
              <LoadingSpinner message="Loading inventory..." />
            ) : filteredItems.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No items found"
                description={
                  searchQuery
                    ? "Try adjusting your search or filter criteria."
                    : "Start by adding your first inventory item."
                }
                actionLabel="Add Item"
                onAction={() => {}}
              />
            ) : (
              <div
                className="rounded-xl overflow-hidden"
                style={{ boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)" }}
              >
                <div className="overflow-x-auto">
                  <table
                    className="w-full"
                    style={{ background: "rgba(255, 255, 255, 0.05)" }}
                  >
                    <thead>
                      <tr
                        style={{
                          background:
                            "linear-gradient(135deg, #7965C1, #483AA0)",
                        }}
                      >
                        <th className="text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white">
                          Item Name
                        </th>
                        <th className="text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white hidden md:table-cell">
                          Category
                        </th>
                        <th className="text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white hidden lg:table-cell">
                          Location
                        </th>
                        <th className="text-center px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white">
                          Stock
                        </th>
                        <th className="text-center px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white">
                          Status
                        </th>
                        <th className="text-center px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item, idx) => (
                        <tr
                          key={item.id}
                          className="transition-all duration-200 hover:scale-[1.01]"
                          style={{
                            background:
                              idx % 2 === 0
                                ? "transparent"
                                : "rgba(255, 255, 255, 0.03)",
                            borderBottom: "1px solid rgba(121, 101, 193, 0.2)",
                          }}
                          data-testid={`row-item-${item.id}`}
                        >
                          <td className="px-4 py-3">
                            <div>
                              <p
                                className="font-semibold"
                                style={{ color: "#E3D095" }}
                              >
                                {item.itemName}
                              </p>
                              <p
                                className="text-xs"
                                style={{ color: "rgba(227, 208, 149, 0.6)" }}
                              >
                                {item.itemDescription}
                              </p>
                            </div>
                          </td>
                          <td
                            className="px-4 py-3 hidden md:table-cell"
                            style={{ color: "#E3D095" }}
                          >
                            {item.itemCategory}
                          </td>
                          <td
                            className="px-4 py-3 hidden lg:table-cell"
                            style={{ color: "#E3D095" }}
                          >
                            {item.itemLocation}
                          </td>
                          <td
                            className="px-4 py-3 text-center"
                            style={{ color: "#E3D095" }}
                          >
                            <span className="font-bold">
                              {item.currentStock}
                            </span>
                            <span
                              className="text-xs ml-1"
                              style={{ color: "rgba(227, 208, 149, 0.6)" }}
                            >
                              {item.itemUnit}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <StatusPill status={item.itemStatus} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                className="p-2 rounded-lg transition-colors hover:bg-white/10"
                                style={{ color: "#E3D095" }}
                                data-testid={`button-edit-${item.id}`}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                className="p-2 rounded-lg transition-colors hover:bg-white/10"
                                style={{ color: "#DC3545" }}
                                data-testid={`button-delete-${item.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
