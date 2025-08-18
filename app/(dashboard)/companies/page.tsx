"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  Drawer,
  Form,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
  message,
  Pagination,
} from "antd";
import { companiesApi } from "@/shared/api/endpoints";
import {
  ExclamationCircleOutlined,
  PlusOutlined,
  TeamOutlined,
} from "@ant-design/icons";

// Типизация данных
type CompanyRead = {
  id: string
  name: string
  description?: string | null
  created_at: string
  updated_at: string
  members_count?: number
  services_count?: number
  user_role?: string
  user_membership_status?: string
}

type MembershipRead = {
  id: string
  user_id: string
  company_id: string
  role_id: number
  status: string
  created_at: string | null
  updated_at: string | null
  user_email?: string
  user_name?: string
  role_name?: string
}

// // Типизация ответа API с пагинацией
type CompanyListResponse = {
  items: CompanyRead[]
  total: number
  page: number
  size: number
  pages: number
}

type MembershipListResponse = {
  items: MembershipRead[]
  total: number
  page: number
  size: number
  pages: number
}

const { Title, Text } = Typography;
const { confirm } = Modal;

export default function Page() {
  const router = useRouter();
  
  // Состояние для компаний
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");

  // Состояние для модальных окон
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<any>(null);
  const [form] = Form.useForm();

  // Состояние для участников
  const [membersOpen, setMembersOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [membersTotal, setMembersTotal] = useState(0);
  const [membersPage, setMembersPage] = useState(1);
  const [membersPageSize, setMembersPageSize] = useState(10);
  const [membersLoading, setMembersLoading] = useState(false);

  // Загрузка компаний с пагинацией
  const load = async (
    page: number = currentPage,
    size: number = pageSize,
    searchQuery: string = search
  ) => {
    setLoading(true);
    try {
      // Если API поддерживает пагинацию, передаем параметры
      const params: any = {
        page,
        size,
        ...(searchQuery && { search: searchQuery }),
      };

      const response = await companiesApi.list();

      // Проверяем, что пришло в ответе
      if (
        response.data &&
        typeof response.data === "object" &&
        "items" in response.data
      ) {
        // Если API возвращает структуру с пагинацией
        const paginatedData: any = response.data;
        setData(paginatedData.items);
        setTotal(paginatedData.total);
      } else {
        // Если API возвращает просто массив, применяем пагинацию на клиенте
        const companies = Array.isArray(response.data) ? response.data : [];

        // Фильтрация для поиска
        const filtered = searchQuery
          ? companies.filter((c: any) =>
              [c.name, c.description, c.id]
                .filter(Boolean)
                .some((v) =>
                  String(v).toLowerCase().includes(searchQuery.toLowerCase())
                )
            )
          : companies;

        // Пагинация на клиенте
        const startIndex = (page - 1) * size;
        const endIndex = startIndex + size;
        const paginatedItems: any = filtered.slice(startIndex, endIndex);

        setData(paginatedItems);
        setTotal(filtered.length);
      }
    } catch (e: any) {
      console.error("Ошибка загрузки компаний:", e);
      message.error(e.message || "Не удалось загрузить компании");
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка участников с пагинацией
  const loadMembers = async (
    companyId: string,
    page: number = 1,
    size: number = 10
  ) => {
    setMembersLoading(true);
    try {
      // const params = { page, size }
      const response = await companiesApi.memberships(companyId);

      if (
        response.data &&
        typeof response.data === "object" &&
        "items" in response.data
      ) {
        const paginatedData = response.data;
        setMembers(paginatedData.items);
        setMembersTotal(paginatedData.total);
      } else {
        const memberships: any = Array.isArray(response.data)
          ? response.data
          : [];
        setMembers(memberships);
        setMembersTotal(memberships.length);
      }
    } catch (e: any) {
      console.error("Ошибка загрузки участников:", e);
      message.error("Не удалось загрузить участников");
      setMembers([]);
      setMembersTotal(0);
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [currentPage, pageSize]);

  // Обработчик поиска
  const handleSearch = (searchValue: string) => {
    setSearch(searchValue);
    setCurrentPage(1); // Сброс на первую страницу при поиске
    load(1, pageSize, searchValue);
  };

  // Обработчик изменения страницы
  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size && size !== pageSize) {
      setPageSize(size);
      load(page, size, search);
    } else {
      load(page, pageSize, search);
    }
  };

  // Обработчик изменения страницы участников
  const handleMembersPageChange = (page: number, size?: number) => {
    setMembersPage(page);
    if (size && size !== membersPageSize) {
      setMembersPageSize(size);
    }
    if (current) {
      loadMembers(current.id, page, size || membersPageSize);
    }
  };

  // Обработчик клика по строке
  const handleRowClick = (record: CompanyRead) => {
    router.push(`/companies/${record.id}`);
  };

  const openCreate = () => {
    setCurrent(null);
    form.resetFields();
    setOpen(true);
  };

  const openEdit = (c:any, e: React.MouseEvent) => {
    e.stopPropagation(); // Предотвращаем переход на деталку при клике на кнопку редактирования
    setCurrent(c);
    form.setFieldsValue({ name: c.name, description: c.description || "" });
    setOpen(true);
  };

  const saveCompany = async () => {
    try {
      const values = await form.validateFields();
      if (current) {
        await companiesApi.update(current.id, values);
        message.success("Компания обновлена");
      } else {
        await companiesApi.create(values);
        message.success("Компания создана");
      }
      setOpen(false);
      await load(); // Перезагружаем текущую страницу
    } catch (error) {
      console.error("Ошибка сохранения:", error);
    }
  };

  const removeCompany = (c: CompanyRead, e: React.MouseEvent) => {
    e.stopPropagation(); // Предотвращаем переход на деталку при клике на кнопку удаления
    confirm({
      title: "Удалить компанию?",
      icon: <ExclamationCircleOutlined />,
      content: "Действие необратимо.",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await companiesApi.delete(c.id);
          message.success("Компания удалена");
          await load(); // Перезагружаем текущую страницу
        } catch (error) {
          console.error("Ошибка удаления:", error);
        }
      },
    });
  };

  const openMembers = async (c: CompanyRead, e: React.MouseEvent) => {
    e.stopPropagation(); // Предотвращаем переход на деталку при клике на кнопку участников
    setCurrent(c);
    setMembersPage(1);
    setMembersOpen(true);
    await loadMembers(c.id, 1, membersPageSize);
  };

  const approveMembership = async (m: MembershipRead) => {
    try {
      await companiesApi.approveMembership(m.company_id, m.id);
      message.success("Участие одобрено");
      await loadMembers(current!.id, membersPage, membersPageSize);
    } catch (error) {
      console.error("Ошибка одобрения:", error);
    }
  };

  const dismissMembership = async (m: MembershipRead) => {
    try {
      await companiesApi.dismissMembership(m.company_id, m.id);
      message.success("Участие отклонено");
      await loadMembers(current!.id, membersPage, membersPageSize);
    } catch (error) {
      console.error("Ошибка отклонения:", error);
    }
  };

  // Форматирование даты
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("ru-RU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Space direction="vertical" size="large" className="w-full">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>
            Компании
          </Title>
          <Text type="secondary">Управление компаниями и участниками</Text>
        </div>
        <div className="flex items-center gap-2">
          <Input.Search
            placeholder="Поиск компании"
            onSearch={handleSearch}
            allowClear
            className="max-w-[280px]"
            enterButton
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Создать
          </Button>
        </div>
      </div>

      <Card>
        <Table<CompanyRead>
          rowKey="id"
          loading={loading}
          dataSource={data}
          pagination={false} // Отключаем встроенную пагинацию таблицы
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: 'pointer' },
            className: 'hover:bg-gray-50'
          })}
          columns={[
            {
              title: "ID",
              dataIndex: "id",
              width: 220,
              ellipsis: true,
              render: (text) => (
                <span className="font-mono text-xs">{text}</span>
              ),
            },
            {
              title: "Название",
              dataIndex: "name",
              render: (text, record) => (
                <div>
                  <div className="font-medium">{text}</div>
                  {record.description && (
                    <div className="text-xs text-gray-500 mt-1">
                      {record.description}
                    </div>
                  )}
                </div>
              ),
            },
            ...(data.some((item:any) => item.members_count !== undefined)
              ? [
                  {
                    title: "Участники",
                    dataIndex: "members_count",
                    width: 100,
                    render: (count: number | undefined) => (
                      <span className="font-medium">{count || 0}</span>
                    ),
                  },
                ]
              : []),
            {
              title: "Создана",
              dataIndex: "created_at",
              width: 160,
              render: formatDate,
            },
            {
              title: "Действия",
              fixed: "right" as const,
              width: 320,
              render: (_, record) => (
                <Space wrap>
                  <Button onClick={(e) => openEdit(record, e)}>Изменить</Button>
                  <Button
                    icon={<TeamOutlined />}
                    onClick={(e) => openMembers(record, e)}
                  >
                    Участники
                  </Button>
                  <Button danger onClick={(e) => removeCompany(record, e)}>
                    Удалить
                  </Button>
                </Space>
              ),
            },
          ]}
          scroll={{ x: 900 }}
        />

        {/* Кастомная пагинация */}
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Показано {data.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-
            {Math.min(currentPage * pageSize, total)} из {total}
          </div>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={total}
            onChange={handlePageChange}
            showSizeChanger
            showQuickJumper
            pageSizeOptions={["10", "20", "50", "100"]}
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} из ${total} записей`
            }
            size="default"
          />
        </div>
      </Card>

      {/* Drawer для создания/редактирования компании */}
      <Drawer
        title={current ? "Изменить компанию" : "Создать компанию"}
        open={open}
        onClose={() => setOpen(false)}
        width={Math.min(
          520,
          typeof window !== "undefined" ? window.innerWidth - 40 : 520
        )}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={() => setOpen(false)}>Отмена</Button>
            <Button type="primary" onClick={saveCompany}>
              Сохранить
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Название"
            rules={[
              { required: true, message: "Введите название" },
              { min: 2, message: "Минимум 2 символа" },
              { max: 100, message: "Максимум 100 символов" },
            ]}
          >
            <Input placeholder="ООО Ромашка" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Описание"
            rules={[{ max: 500, message: "Максимум 500 символов" }]}
          >
            <Input.TextArea rows={4} placeholder="Краткое описание" />
          </Form.Item>
        </Form>
      </Drawer>

      {/* Drawer для участников */}
      <Drawer
        title={`Участники: ${current?.name || ""}`}
        open={membersOpen}
        onClose={() => setMembersOpen(false)}
        width={Math.min(
          720,
          typeof window !== "undefined" ? window.innerWidth - 40 : 720
        )}
      >
        <Table<MembershipRead>
          rowKey="id"
          loading={membersLoading}
          dataSource={members}
          pagination={false}
          columns={[
            {
              title: "ID",
              dataIndex: "id",
              width: 200,
              ellipsis: true,
              render: (text) => (
                <span className="font-mono text-xs">{text}</span>
              ),
            },
            {
              title: "User ID",
              dataIndex: "user_id",
              width: 200,
              ellipsis: true,
              render: (text) => (
                <span className="font-mono text-xs">{text}</span>
              ),
            },
            {
              title: "Роль",
              dataIndex: "role_id",
              width: 80,
              render: (roleId, record) => record.role_name || `Role ${roleId}`,
            },
            {
              title: "Статус",
              dataIndex: "status",
              width: 100,
              render: (status) => (
                <Tag
                  color={
                    status === "active"
                      ? "green"
                      : status === "pending"
                      ? "orange"
                      : status === "suspended"
                      ? "red"
                      : "default"
                  }
                >
                  {status === "active"
                    ? "Активен"
                    : status === "pending"
                    ? "Ожидает"
                    : status === "suspended"
                    ? "Заблокирован"
                    : status}
                </Tag>
              ),
            },
            {
              title: "Создано",
              dataIndex: "created_at",
              width: 160,
              render: formatDate,
            },
            {
              title: "Действия",
              fixed: "right" as const,
              width: 180,
              render: (_, member) => (
                <Space>
                  {member.status === "pending" && (
                    <Button
                      size="small"
                      onClick={() => approveMembership(member)}
                    >
                      Одобрить
                    </Button>
                  )}
                  <Button
                    size="small"
                    danger
                    onClick={() => dismissMembership(member)}
                  >
                    {member.status === "pending" ? "Отклонить" : "Исключить"}
                  </Button>
                </Space>
              ),
            },
          ]}
          scroll={{ x: 800 }}
        />

        {/* Пагинация для участников */}
        {membersTotal > 0 && (
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Участников: {membersTotal}
            </div>
            <Pagination
              current={membersPage}
              pageSize={membersPageSize}
              total={membersTotal}
              onChange={handleMembersPageChange}
              showSizeChanger
              pageSizeOptions={["10", "20", "50"]}
              size="small"
            />
          </div>
        )}
      </Drawer>
    </Space>
  );
}