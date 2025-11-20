"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";

import PokemonTypeSelector from "@/components/pokemon-type-selector";
import ReportsTable from "@/components/reports-table";
import { getPokemonTypes } from "@/services/pokemon-service";
import {
  getReports,
  createReport,
  deleteReport,
} from "@/services/report-service";

export default function PokemonReportsPage() {
  const [pokemonTypes, setPokemonTypes] = useState([]);
  const [reports, setReports] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);
  const [creatingReport, setCreatingReport] = useState(false);
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState("");
  const [limit, setLimit] = useState(0);

  // Cargar los tipos de Pokémon
  useEffect(() => {
    const loadPokemonTypes = async () => {
      try {
        setLoadingTypes(true);
        setError(null);
        const types = await getPokemonTypes();
        setPokemonTypes(types);
        setLoadingTypes(false);
      } catch (error) {
        console.error("Error loading Pokemon types:", error);
        setError(
          "Error al cargar los tipos de Pokémon. Por favor, intenta de nuevo más tarde."
        );
        setLoadingTypes(false);
      }
    };

    loadPokemonTypes();
  }, []);

  // Función para cargar los reportes
  const loadReports = async () => {
    try {
      setLoadingReports(true);
      setError(null);
      const reportData = await getReports();
      setReports(reportData);
      setLoadingReports(false);
      return reportData;
    } catch (error) {
      console.error("Error loading reports:", error);
      setError(
        "Error al cargar los reportes. Por favor, intenta de nuevo más tarde."
      );
      setLoadingReports(false);
      throw error;
    }
  };

  // Función para refrescar la tabla
  const handleRefreshTable = async () => {
    try {
      await loadReports();
      return true;
    } catch (error) {
      throw error;
    }
  };

  // Cargar los reportes al iniciar
  useEffect(() => {
    loadReports();
  }, []);

  // Función para capturar todos los Pokémon del tipo seleccionado
  const catchThemAll = async () => {
    if (!selectedType) return;

    try {
      setCreatingReport(true);

      // Crear un nuevo reporte usando la API
      await createReport(selectedType, limit);
      // Mostrar notificación de éxito
      toast.success(
        `Se ha generado un nuevo reporte para el tipo ${selectedType}.`
      );

      // Refrescar la tabla para mostrar el nuevo reporte
      await loadReports();

      setCreatingReport(false);
    } catch (error) {
      console.error("Error creating report:", error);

      // Mostrar notificación de error
      toast.error("No se pudo crear el reporte. Por favor, intenta de nuevo.");

      setCreatingReport(false);
    }
  };

  // Función para descargar el CSV
  const handleDownloadCSV = (url) => {
    window.open(url, "_blank");
  };

  const isLoading = loadingTypes || loadingReports;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);

  const openDeleteModal = (report) => {
    setReportToDelete(report);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const id = reportToDelete?.ReportId || reportToDelete?.ReportId;
      console.log("handleConfirmDelete id", id);

      await deleteReport(id);
      toast.success("Reporte eliminado");

      setConfirmOpen(false);
      setReportToDelete(null);

      await loadReports();
    } catch (err) {
      toast.error("No se pudo eliminar el reporte");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold">
            Pokémon Reports Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex md:flex-row gap-4 mb-6">
            <div className="w-full md:w-1/3">
              <PokemonTypeSelector
                pokemonTypes={pokemonTypes}
                selectedType={selectedType}
                onTypeChange={setSelectedType}
                loading={loadingTypes}
              />
            </div>
            <div className="flex items-center justify-center w-full md:w-2/3">
              <div className="flex items-center justify-center w-full mr-8">
                <label
                  htmlFor="limit"
                  className="block text-sm font-medium text-gray-700 mr-2"
                >
                  Cantidad de Pokemons(opcional):
                </label>
                <div className="relative flex flex-col">
                  <input
                    id="limit"
                    name="limit"
                    type="number"
                    min="1"
                    max="1000"
                    defaultValue={0}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-md py-2 px-3 text-sm text-gray-700 placeholder-gray-400 shadow-sm
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                  <p className="text-xs">
                    Deja en 0 para traer todos los pokemon
                  </p>
                </div>
              </div>
              <div className="w-full ">
                <Button
                  onClick={() => catchThemAll()}
                  disabled={!selectedType || isLoading || creatingReport}
                  className="w-full font-bold"
                >
                  {creatingReport
                    ? "Creating..."
                    : isLoading
                    ? "Loading..."
                    : "Catch them all!"}
                </Button>
              </div>
            </div>
          </div>

          <ReportsTable
            reports={reports}
            loading={loadingReports}
            onRefresh={handleRefreshTable}
            onDownload={handleDownloadCSV}
            onDelete={openDeleteModal}
          />

          <ConfirmModal
            open={confirmOpen}
            title="Eliminar reporte"
            message="¿Estás seguro que deseas eliminar este reporte? Esta acción no se puede deshacer."
            onCancel={() => setConfirmOpen(false)}
            onConfirm={handleConfirmDelete}
          />
        </CardContent>
      </Card>
    </div>
  );
}
