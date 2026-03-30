import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  FaEdit,
  FaTrash,
  FaTimes,
  FaSearch,
  FaUserShield,
  FaUserTie,
  FaStore,
  FaUser,
  FaSync,
  FaEnvelope,
  FaPhone,
} from "react-icons/fa";
import { toast } from "react-toastify";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import {
  useGetUsersQuery,
  useDeleteUserMutation,
} from "../../slices/usersApiSlice";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";

const UserListScreen = () => {
  const { language } = useSelector((state) => state.language);

  // API Calls
  const { data: users, refetch, isLoading, error } = useGetUsersQuery();
  const [deleteUser, { isLoading: loadingDelete }] = useDeleteUserMutation();

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Translations
  const translations = {
    en: {
      title: "User Management",
      subtitle: "Manage system users and permissions",
      searchPlaceholder: "Search name or email...",
      headers: {
        user: "User",
        role: "Role",
        contact: "Contact",
        date: "Joined",
        actions: "Actions",
      },
      roles: {
        admin: "Admin",
        staff: "Staff",
        store: "Store",
        pcb: "PCB Admin",
        user: "User",
      },
      modal: {
        title: "Confirm Delete",
        body: "Are you sure you want to delete this user?",
        cancel: "Cancel",
        confirm: "Delete",
      },
      btn: { edit: "Edit", delete: "Delete", refresh: "Refresh" },
      noData: "No users found.",
    },
    thai: {
      title: "จัดการผู้ใช้งาน",
      subtitle: "จัดการรายชื่อและสิทธิ์การใช้งานในระบบ",
      searchPlaceholder: "ค้นหาชื่อ หรืออีเมล...",
      headers: {
        user: "ผู้ใช้งาน",
        role: "สิทธิ์",
        contact: "ข้อมูลติดต่อ",
        date: "วันที่สมัคร",
        actions: "จัดการ",
      },
      roles: {
        admin: "ผู้ดูแลระบบ",
        staff: "พนักงาน",
        store: "คลังสินค้า",
        pcb: "ผู้ดูแล PCB",
        user: "สมาชิกทั่วไป",
      },
      modal: {
        title: "ยืนยันการลบ",
        body: "คุณแน่ใจหรือไม่ที่จะลบผู้ใช้งานรายนี้? การกระทำนี้ไม่สามารถย้อนกลับได้",
        cancel: "ยกเลิก",
        confirm: "ลบข้อมูล",
      },
      btn: { edit: "แก้ไข", delete: "ลบ", refresh: "รีเฟรช" },
      noData: "ไม่พบรายชื่อผู้ใช้งาน",
    },
  };
  const t = translations[language] || translations.en;

  // --- Handlers ---
  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteUser(userToDelete._id || userToDelete.id).unwrap();
      toast.success("User deleted successfully");
      refetch();
      setShowDeleteModal(false);
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  // --- Logic & Filter ---
  const filteredUsers = useMemo(() => {
    if (!users) return [];

    let processed = [...users];

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      processed = processed.filter(
        (user) =>
          (user.name && user.name.toLowerCase().includes(lowerTerm)) ||
          (user.email && user.email.toLowerCase().includes(lowerTerm)),
      );
    }

    return processed;
  }, [users, searchTerm]);

  // --- UI Components ---

  // Minimal Avatar: User avatar with initials
  const UserAvatar = ({ name }) => {
    const initials = name ? name.charAt(0).toUpperCase() : "U";
    return (
      <div
        className="rounded-full flex items-center justify-center text-blue-600 bg-blue-50 border border-blue-100 font-bold"
        style={{ width: "42px", height: "42px", fontSize: "1.1rem" }}
      >
        {initials}
      </div>
    );
  };

  // Minimal Badges
  const RoleBadge = ({ user }) => {
    const badges = [];
    // Admin: Red
    if (user.isAdmin)
      badges.push({
        color: "text-red-700",
        bg: "bg-red-50",
        border: "border-red-200",
        icon: <FaUserShield className="mr-1" />,
        text: t.roles.admin,
      });
    // PCB Admin: Purple
    if (user.isPCBAdmin)
      badges.push({
        color: "text-purple-700",
        bg: "bg-purple-50",
        border: "border-purple-200",
        icon: <FaUserShield className="mr-1" />,
        text: t.roles.pcb,
      });
    // Store: Orange
    if (user.isStore)
      badges.push({
        color: "text-orange-700",
        bg: "bg-orange-50",
        border: "border-orange-200",
        icon: <FaStore className="mr-1" />,
        text: t.roles.store,
      });
    // Staff: Blue
    if (user.isStaff)
      badges.push({
        color: "text-cyan-700",
        bg: "bg-cyan-50",
        border: "border-cyan-200",
        icon: <FaUserTie className="mr-1" />,
        text: t.roles.staff,
      });

    if (badges.length === 0) {
      return (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-md text-sm font-medium border bg-slate-50 text-slate-600 border-slate-200`}
        >
          <FaUser className="mr-1" /> {t.roles.user}
        </span>
      );
    }

    return (
      <div className="flex flex-wrap gap-2">
        {badges.map((b, i) => (
          <span
            key={i}
            className={`inline-flex items-center px-2 py-1 rounded-md text-sm font-medium border ${b.color} ${b.bg} ${b.border}`}
          >
            {b.icon} {b.text}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-black min-h-screen font-sans transition-colors duration-500">
      <div className="max-w-7xl mx-auto">
        {/* Header & Toolbar */}
        <div className="bg-white dark:bg-zinc-900/50 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-zinc-800 mb-8 transition-colors duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center">
              <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-full border border-slate-100 dark:border-zinc-800">
                <FaUserShield className="text-2xl text-slate-600 dark:text-slate-400" />
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                  {t.title}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t.subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  className="block w-full pl-10 pr-10 py-2 border border-slate-300 dark:border-zinc-800 rounded-xl leading-5 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    onClick={() => setSearchTerm("")}
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
              <button
                onClick={refetch}
                title={t.btn.refresh}
                className="p-2.5 bg-white dark:bg-zinc-950 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-xl transition-colors shadow-sm flex items-center justify-center shrink-0"
              >
                <FaSync className={isLoading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader />
          </div>
        ) : error ? (
          <Message variant="error">
            {error?.data?.message || error.message || "Error loading users"}
          </Message>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-900/30 rounded-3xl shadow-sm border border-dashed border-slate-300 dark:border-zinc-800 flex flex-col items-center">
            <FaUser className="text-5xl text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400">{t.noData}</h3>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block bg-white dark:bg-zinc-900/30 shadow-sm border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden transition-colors duration-500">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-zinc-800">
                  <thead className="bg-slate-50 dark:bg-zinc-950">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider"
                      >
                        {t.headers.user}
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider"
                      >
                        {t.headers.role}
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider"
                      >
                        {t.headers.contact}
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider"
                      >
                        {t.headers.date}
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider"
                      >
                        {t.headers.actions}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-transparent divide-y divide-slate-200 dark:divide-zinc-800">
                    {filteredUsers.map((user) => (
                      <tr
                        key={user._id || user.id}
                        className="hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <UserAvatar name={user.name} />
                            <div className="ml-4">
                              <div className="text-sm font-bold text-slate-900 dark:text-white">
                                {user.name}
                              </div>
                              <div className="text-xs font-mono text-slate-500 opacity-75">
                                ID:{" "}
                                {String(user._id || user.id).substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <RoleBadge user={user} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col text-sm text-slate-600 dark:text-slate-300">
                            <div className="flex items-center mb-1">
                              <FaEnvelope className="mr-2 text-slate-400 dark:text-slate-500" />{" "}
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="flex items-center">
                                <FaPhone className="mr-2 text-slate-400 dark:text-slate-500" />{" "}
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-500 dark:text-slate-400">
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString(
                              "th-TH",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )
                            : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2 text-center items-center">
                            <Link
                              to={`/admin/user/${user._id || user.id}/edit`}
                              title={t.btn.edit}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-200 dark:hover:border-blue-800 transition-colors shadow-sm"
                            >
                              <FaEdit />
                            </Link>

                            <button
                              onClick={() => handleDeleteClick(user)}
                              title={t.btn.delete}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-200 dark:hover:border-red-800 transition-colors shadow-sm"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden flex flex-col gap-4">
              {filteredUsers.map((user) => (
                <div
                  key={user._id || user.id}
                  className="bg-white dark:bg-zinc-900/50 shadow-sm border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 transition-colors duration-500"
                >
                  <div className="flex items-center mb-4">
                    <UserAvatar name={user.name} />
                    <div className="ml-4 overflow-hidden">
                      <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">
                        {user.name}
                      </h4>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {user.email}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <RoleBadge user={user} />
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
                    <Link
                      to={`/admin/user/${user._id || user.id}/edit`}
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-slate-300 dark:border-zinc-800 rounded-xl text-sm font-medium text-slate-700 dark:text-white bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors"
                    >
                      <FaEdit className="mr-2" /> {t.btn.edit}
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(user)}
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-red-200 rounded-xl text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                    >
                      <FaTrash className="mr-2" /> {t.btn.delete}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title={
            <div className="flex items-center text-red-600 dark:text-red-400">
              <FaTrash className="mr-2" />
              <span>{t.modal.title}</span>
            </div>
          }
        >
          <div className="p-6 bg-white dark:bg-zinc-950 rounded-3xl transition-colors duration-500">
            <p className="text-slate-600 dark:text-slate-400 mb-5">{t.modal.body}</p>
            {userToDelete && (
              <div className="bg-slate-50 dark:bg-zinc-900 p-4 border border-slate-200 dark:border-zinc-800 rounded-xl flex items-center mb-6">
                <UserAvatar name={userToDelete.name} />
                <div className="ml-4">
                  <div className="font-bold text-slate-900 dark:text-white">
                    {userToDelete.name}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {userToDelete.email}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                className="dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
                onClick={() => setShowDeleteModal(false)}
              >
                {t.modal.cancel}
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteConfirm}
                disabled={loadingDelete}
                className="flex items-center relative"
              >
                {loadingDelete && (
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                )}
                <span className={loadingDelete ? "opacity-0" : ""}>
                  {t.modal.confirm}
                </span>
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default UserListScreen;
