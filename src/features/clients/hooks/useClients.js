import { useEffect, useMemo, useState } from "react";

import { useDebouncedValue } from "../../../hook/useDebouncedValue";
import { createMessageState } from "../components/ClientMessageModal";

import {
  createClient,
  deleteClient,
  deleteClientLogo,
  fetchClientById,
  fetchClientOrders,
  fetchClients,
  saveClientAddresses,
  updateClient,
  uploadClientLogo,
} from "../services/clients.service";

import {
  getClientOrderTotals,
  getStoragePathFromUrl,
} from "../client.helpers";

export function useClients() {
  const [clients, setClients] = useState([]);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput);

  const [selectedClient, setSelectedClient] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [messageModal, setMessageModal] = useState(createMessageState());

  function showMessage(title, message, tone = "info") {
    setMessageModal({
      open: true,
      title,
      message,
      tone,
    });
  }

  function closeMessageModal() {
    setMessageModal(createMessageState());
  }

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
      showMessage(
        "No se pudieron cargar los clientes",
        error.message || "Revisa tu conexión o intenta de nuevo.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadClientOrders(clientId) {
    if (!clientId) {
      setOrders([]);
      return;
    }

    try {
      setLoadingOrders(true);
      const data = await fetchClientOrders(clientId);
      setOrders(data);
    } catch (error) {
      console.error(error);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }

  async function saveClient(payload, logoFile, addresses = []) {
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

      await saveClientAddresses(savedClient.id, addresses);

      const hydratedClient = await fetchClientById(savedClient.id);
      setSelectedClient(hydratedClient);
      setModalOpen(false);

      const updatedClients = await fetchClients(search);
      setClients(updatedClients);
    } catch (error) {
      console.error(error);
      showMessage(
        "No se pudo guardar el cliente",
        error.message || "Revisa la información e intenta de nuevo.",
        "error",
      );
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
        setOrders([]);
      }

      await loadClients();
    } catch (error) {
      console.error(error);

      if (String(error.message || "").toLowerCase().includes("foreign key")) {
        showMessage(
          "No puedes borrar este cliente",
          "Este cliente tiene etiquetas o pedidos asociados. Conserva el registro para no romper el historial.",
          "warning",
        );
        return;
      }

      showMessage(
        "No se pudo eliminar el cliente",
        error.message || "Intenta de nuevo.",
        "error",
      );
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, [search]);

  useEffect(() => {
    loadClientOrders(selectedClient?.id || null);
  }, [selectedClient?.id]);

  const totals = useMemo(() => getClientOrderTotals(orders), [orders]);

  return {
    clients,
    orders,
    totals,

    loading,
    loadingOrders,
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

    messageModal,
    closeMessageModal,

    saveClient,
    removeClient,
  };
}