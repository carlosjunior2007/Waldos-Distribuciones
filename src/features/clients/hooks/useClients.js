import { useEffect, useMemo, useState } from "react";

import { useDebouncedValue } from "../../../hook/useDebouncedValue";

import {
  createClient,
  deleteClient,
  deleteClientLogo,
  fetchClientQuotations,
  fetchClients,
  updateClient,
  uploadClientLogo,
} from "../services/clients.service";

import {
  getClientTotals,
  getStoragePathFromUrl,
} from "../client.helpers";

export function useClients() {
  const [clients, setClients] = useState([]);
  const [quotations, setQuotations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingQuotations, setLoadingQuotations] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput);

  const [selectedClient, setSelectedClient] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);

  async function loadClients() {
    try {
      setLoading(true);

      const data = await fetchClients(search);

      setClients(data);

      if (!selectedClient && data.length) {
        setSelectedClient(data[0]);
      }

      if (selectedClient) {
        const updated = data.find((item) => item.id === selectedClient.id);
        if (updated) setSelectedClient(updated);
      }
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudieron cargar los clientes.");
    } finally {
      setLoading(false);
    }
  }

  async function loadClientQuotations(clientId) {
    if (!clientId) {
      setQuotations([]);
      return;
    }

    try {
      setLoadingQuotations(true);
      const data = await fetchClientQuotations(clientId);
      setQuotations(data);
    } catch (error) {
      console.error(error);
      setQuotations([]);
    } finally {
      setLoadingQuotations(false);
    }
  }

  async function saveClient(payload, logoFile) {
    try {
      setSaving(true);

      let savedClient;

      if (payload.id) {
        const { id, ...rest } = payload;
        savedClient = await updateClient(id, rest);
      } else {
        savedClient = await createClient(payload);
      }

      if (logoFile) {
        const oldLogo = savedClient.logo;
        const logoUrl = await uploadClientLogo(logoFile, savedClient.id);

        savedClient = await updateClient(savedClient.id, {
          logo: logoUrl,
        });

        if (oldLogo && oldLogo !== logoUrl) {
          const oldPath = getStoragePathFromUrl(oldLogo);

          if (oldPath) {
            try {
              await deleteClientLogo(oldPath);
            } catch (error) {
              console.error("No se pudo eliminar el logo anterior:", error);
            }
          }
        }
      }

      setSelectedClient(savedClient);
      setModalOpen(false);
      await loadClients();
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudo guardar el cliente.");
    } finally {
      setSaving(false);
    }
  }

  async function removeClient(client) {
    if (!client?.id) return;

    try {
      setDeleting(true);

      await deleteClient(client.id);

      const logoPath = getStoragePathFromUrl(client.logo);

      if (logoPath) {
        try {
          await deleteClientLogo(logoPath);
        } catch (error) {
          console.error("No se pudo eliminar el logo del bucket:", error);
        }
      }

      setClientToDelete(null);

      if (selectedClient?.id === client.id) {
        setSelectedClient(null);
        setQuotations([]);
      }

      await loadClients();
    } catch (error) {
      console.error(error);

      if (String(error.message || "").toLowerCase().includes("foreign key")) {
        alert(
          "No puedes borrar este cliente porque tiene etiquetas o cotizaciones asociadas.",
        );
        return;
      }

      alert(error.message || "No se pudo eliminar el cliente.");
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, [search]);

  useEffect(() => {
    loadClientQuotations(selectedClient?.id || null);
  }, [selectedClient?.id]);

  const totals = useMemo(() => getClientTotals(quotations), [quotations]);

  return {
    clients,
    quotations,
    totals,

    loading,
    loadingQuotations,
    saving,
    deleting,

    searchInput,
    setSearchInput,

    selectedClient,
    setSelectedClient,

    modalOpen,
    setModalOpen,

    clientToDelete,
    setClientToDelete,

    saveClient,
    removeClient,
  };
}