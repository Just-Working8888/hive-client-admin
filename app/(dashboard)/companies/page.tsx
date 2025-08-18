"use client";

import { useEffect, useState } from "react";
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
  Typography,
  message,
} from "antd";
import { companiesApi } from "@/shared/api/endpoints";
import {
  ExclamationCircleOutlined,
  PlusOutlined,
  TeamOutlined,
} from "@ant-design/icons";

// Типизация данных
type CompanyRead = {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
  members_count?: number;
  services_count?: number;
  user_role?: string;
  user_membership_status?: string;
};

type CompanyListResponse = {
  items: CompanyRead[];
  total: number;
  page: number;
  size: number;
  pages: number;
};

const { Title, Text } = Typography;
const { confirm } = Modal;

export default function Page() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CompanyRead[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<CompanyRead | null>(null);
  const [form] = Form.useForm();

  const load = async (page = currentPage, size = pageSize, searchValue = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        ...(searchValue && { search: searchValue }),
      });

      const response = await companiesApi.listPaginated(params.toString());
      const paginatedData: CompanyListResponse = response.data;
      setData(paginatedData.items);
      setTotal(paginatedData.total);
    } catch (e: any) {
      message.error(e.message || "Не удалось загрузить компании");
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [currentPage, pageSize, search]);

  const handleSearch = (searchValue: string) => {
    setSearch(searchValue);
    setCurrentPage(1);
    load(1, pageSize, searchValue);
  };

  const handleRowClick = (record: CompanyRead) => router.push(`/companies/${record.id}`);

  const openCreate = () => {
    setCurrent(null);
    form.resetFields();
    setOpen(true);
  };

  const openEdit = (c: CompanyRead, e: React.MouseEvent) => {
    e.stopPropagation();
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
      await load();
    } catch (error) {
      message.error("Ошибка при сохранении компании");
    }
  };

  const removeCompany = (c: CompanyRead, e: React.MouseEvent) => {
    e.stopPropagation();
    confirm({
      title: "Удалить компанию?",
      icon: <ExclamationCircleOutlined />,
      content: "Действие необратимо.",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await companiesApi.delete(c.id);
          message.success("Компания удалена");
          await load();
        } catch (error) {
          message.error("Ошибка при удалении компании");
        }
      },
    });
  };

  const openMembers = async (c: CompanyRead, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrent(c);
  };

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
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} из ${total} компаний`,
            pageSizeOptions: ["10", "20", "50", "100"],
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
            onShowSizeChange: (current, size) => {
              setPageSize(size);
              setCurrentPage(1);
            },
          }}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: "pointer" },
            className: "hover:bg-gray-50",
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
            ...(data.some((item) => item.members_count !== undefined)
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
      </Card>

      <Drawer
        title={current ? "Изменить компанию" : "Создать компанию"}
        open={open}
        onClose={() => setOpen(false)}
        width={Math.min(
          520,
          typeof window !== "undefined" ? window.innerWidth - 40 : 520
        )}
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
    </Space>
  );
}