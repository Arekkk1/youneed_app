import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Users, Wrench, Package } from 'lucide-react'; // Corrected: Tool -> Wrench
import api from '../../../api'; // Use the configured api instance
import toast from 'react-hot-toast';
import Modal from '../../ui/Modal'; // Assuming a generic Modal component exists

const EmployeesEquipmentModule = () => {
    const [employees, setEmployees] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
    const [isLoadingEquipment, setIsLoadingEquipment] = useState(false);
    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
    const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null); // Can be employee or equipment object
    const [itemType, setItemType] = useState(''); // 'employee' or 'equipment'
    const [newItemName, setNewItemName] = useState('');
    // Add state for employee services if applicable
    // const [newItemServices, setNewItemServices] = useState([]);

    const fetchEmployees = useCallback(async () => {
        setIsLoadingEmployees(true);
        try {
            const response = await api.get('/provider/employees');
            if (response.data.status === 'success') {
                setEmployees(response.data.data || []);
            } else {
                 throw new Error(response.data.message || 'Failed to fetch employees');
            }
        } catch (error) {
            console.error("Błąd pobierania pracowników:", error);
            toast.error(`Błąd pobierania pracowników: ${error.message}`);
        } finally {
            setIsLoadingEmployees(false);
        }
    }, []);

    const fetchEquipment = useCallback(async () => {
        setIsLoadingEquipment(true);
        try {
            const response = await api.get('/provider/equipment');
             if (response.data.status === 'success') {
                setEquipment(response.data.data || []);
            } else {
                 throw new Error(response.data.message || 'Failed to fetch equipment');
            }
        } catch (error) {
            console.error("Błąd pobierania sprzętu:", error);
            toast.error(`Błąd pobierania sprzętu: ${error.message}`);
        } finally {
            setIsLoadingEquipment(false);
        }
    }, []);

    useEffect(() => {
        fetchEmployees();
        fetchEquipment();
    }, [fetchEmployees, fetchEquipment]);

    const openModal = (type, item = null) => {
        setItemType(type);
        setEditingItem(item);
        setNewItemName(item ? item.name : '');
        // Reset/set other fields like services if editing employee
        if (type === 'employee') {
            setIsEmployeeModalOpen(true);
        } else {
            setIsEquipmentModalOpen(true);
        }
    };

    const closeModal = () => {
        setIsEmployeeModalOpen(false);
        setIsEquipmentModalOpen(false);
        setEditingItem(null);
        setNewItemName('');
        setItemType('');
        // Reset other fields
    };

    const handleSave = async () => {
        if (!newItemName.trim()) {
            toast.error('Nazwa nie może być pusta.');
            return;
        }

        // *** CORRECTED ENDPOINT PATH (singular 'employee' or 'equipment') ***
        const url = `/provider/${itemType}${editingItem ? `/${editingItem.id}` : ''}`;
        const method = editingItem ? 'put' : 'post';
        const data = { name: newItemName };
        // Add services to data if itemType is 'employee'
        // if (itemType === 'employee') data.services = newItemServices;

        const toastId = toast.loading(editingItem ? 'Aktualizowanie...' : 'Dodawanie...');

        try {
            const response = await api[method](url, data);
             if (response.data.status === 'success') {
                toast.success(editingItem ? 'Zaktualizowano pomyślnie!' : 'Dodano pomyślnie!', { id: toastId });
                if (itemType === 'employee') {
                    fetchEmployees();
                } else {
                    fetchEquipment();
                }
                closeModal();
            } else {
                 throw new Error(response.data.message || `Failed to ${editingItem ? 'update' : 'add'} item`);
            }
        } catch (error) {
            console.error(`Błąd ${editingItem ? 'aktualizacji' : 'dodawania'} ${itemType}:`, error);
            toast.error(`Błąd: ${error.message}`, { id: toastId });
        }
    };

    const handleDelete = async (type, id) => {
        if (!window.confirm(`Czy na pewno chcesz usunąć ten ${type === 'employee' ? 'pracownika' : 'sprzęt'}?`)) {
            return;
        }

        // *** CORRECTED ENDPOINT PATH (singular 'employee' or 'equipment') ***
        const url = `/provider/${type}/${id}`;
        const toastId = toast.loading('Usuwanie...');

        try {
            const response = await api.delete(url);
             if (response.data.status === 'success') {
                toast.success('Usunięto pomyślnie!', { id: toastId });
                if (type === 'employee') {
                    fetchEmployees();
                } else {
                    fetchEquipment();
                }
            } else {
                 throw new Error(response.data.message || 'Failed to delete item');
            }
        } catch (error) {
            console.error(`Błąd usuwania ${type}:`, error);
            toast.error(`Błąd usuwania: ${error.message}`, { id: toastId });
        }
    };

    const renderList = (title, items, type, isLoading) => (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                    {type === 'employee' ? <Users className="mr-2" size={20} /> : <Package className="mr-2" size={20} />}
                    {title} ({items.length})
                </h3>
                <button
                    onClick={() => openModal(type)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                >
                    <Plus className="mr-1 -ml-1 h-5 w-5" /> Dodaj
                </button>
            </div>
            {isLoading ? (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">Ładowanie...</div>
            ) : items.length === 0 ? (
                 <div className="text-center py-4 text-gray-500 dark:text-gray-400">Brak pozycji do wyświetlenia.</div>
            ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-60 overflow-y-auto">
                    {items.map((item) => (
                        <li key={item.id} className="py-3 flex justify-between items-center">
                            <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                            {/* Display services for employee if applicable */}
                            {/* {type === 'employee' && item.services && (
                                <span className="text-xs text-gray-500 ml-2">({item.services.join(', ')})</span>
                            )} */}
                            <div className="space-x-2">
                                <button
                                    onClick={() => openModal(type, item)}
                                    className="text-gray-400 hover:text-sky-600 dark:hover:text-sky-400"
                                    title="Edytuj"
                                >
                                    <Edit size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(type, item.id)}
                                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                    title="Usuń"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderList('Pracownicy', employees, 'employee', isLoadingEmployees)}
            {renderList('Sprzęt', equipment, 'equipment', isLoadingEquipment)}

            {/* Employee Modal */}
            <Modal isOpen={isEmployeeModalOpen} onClose={closeModal} title={editingItem ? 'Edytuj Pracownika' : 'Dodaj Pracownika'}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="employeeName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Imię i Nazwisko / Nazwa
                        </label>
                        <input
                            type="text"
                            id="employeeName"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            placeholder="Np. Jan Kowalski"
                        />
                    </div>
                    {/* Add fields for employee services if needed */}
                    {/* <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Przypisane Usługi (opcjonalnie)
                        </label>
                        // Input for selecting/managing services
                    </div> */}
                    <div className="flex justify-end space-x-3 pt-4">
                        <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600">
                            Anuluj
                        </button>
                        <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 border border-transparent rounded-md shadow-sm">
                            {editingItem ? 'Zapisz Zmiany' : 'Dodaj Pracownika'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Equipment Modal */}
            <Modal isOpen={isEquipmentModalOpen} onClose={closeModal} title={editingItem ? 'Edytuj Sprzęt' : 'Dodaj Sprzęt'}>
                 <div className="space-y-4">
                    <div>
                        <label htmlFor="equipmentName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nazwa Sprzętu
                        </label>
                        <input
                            type="text"
                            id="equipmentName"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            placeholder="Np. Wiertarka udarowa"
                        />
                    </div>
                    {/* Add other fields for equipment if needed (e.g., description, quantity) */}
                    <div className="flex justify-end space-x-3 pt-4">
                        <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600">
                            Anuluj
                        </button>
                        <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 border border-transparent rounded-md shadow-sm">
                            {editingItem ? 'Zapisz Zmiany' : 'Dodaj Sprzęt'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default EmployeesEquipmentModule;
