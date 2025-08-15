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
  Switch,
  Table,
  Tag,
  Typography,
  message,
  Select,
  Row,
  Col,
  AutoComplete,
} from "antd";
import { usersApi, rolesApi } from "@/shared/api/endpoints";
import {
  ExclamationCircleOutlined,
  KeyOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { debounce } from "lodash";

// Типы данных
type UserRead = {
  id: string;
  email: string | null;
  phone: string | null;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  is_active: boolean;
  is_verified: boolean;
  permissions?: string[] | null;
  memberships?: any[] | null;
  department?: string | null;
  created_at?: string;
};

type RoleRead = { 
  id: number; 
  name: string; 
  description?: string | null;
};

// Типы для API пагинации
type PaginatedResponse<T> = {
  items: T[];
  page: number;
  pages: number;
  size: number;
  total: number;
  has_next: boolean;
  has_prev: boolean;
};

type UserFilters = {
  search?: string;
  is_active?: boolean;
  is_verified?: boolean;
  sort_by?: 'created_at' | 'email' | 'first_name' | 'last_name';
  sort_order?: 'asc' | 'desc';
};

type UserSuggestion = {
  id: string;
  email: string;
  name: string;
};

const { Title, Text } = Typography;
const { confirm } = Modal;
const { Option } = Select;

export default function Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PaginatedResponse<UserRead>>({
    items: [],
    page: 1,
    pages: 0,
    size: 10,
    total: 0,
    has_next: false,
    has_prev: false,
  });
  const [roles, setRoles] = useState<RoleRead[]>([]);
  const [filters, setFilters] = useState<UserFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<UserRead | null>(null);
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [searchValue, setSearchValue] = useState('');
  
  const [form] = Form.useForm();
  const [pwdForm] = Form.useForm();
  const [roleForm] = Form.useForm();
  const [filtersForm] = Form.useForm();

  // Обновленная функция загрузки с параметрами
  const load = async (page = currentPage, size = pageSize, filterParams: UserFilters = filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        ...(filterParams.search && { search: filterParams.search }),
        ...(typeof filterParams.is_active === 'boolean' && { 
          is_active: filterParams.is_active.toString() 
        }),
        ...(typeof filterParams.is_verified === 'boolean' && { 
          is_verified: filterParams.is_verified.toString() 
        }),
        ...(filterParams.sort_by && { sort_by: filterParams.sort_by }),
        ...(filterParams.sort_order && { sort_order: filterParams.sort_order }),
      });

      const response = await usersApi.listPaginated(params.toString());
      setData(response.data);
    } catch (e: any) {
      message.error(e.message || "Не удалось загрузить пользователей");
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const { data } = await rolesApi.list();
      setRoles(data);
    } catch {}
  };

  // Автодополнение для поиска
  const loadSuggestions = debounce(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }
    
    try {
      const response = await usersApi.searchSuggestions(query, 5);
      setSuggestions(response.data);
    } catch {
      setSuggestions([]);
    }
  }, 300);

  useEffect(() => {
    load();
    loadRoles();
  }, []);

  useEffect(() => {
    load(currentPage, pageSize, filters);
  }, [currentPage, pageSize, filters]);

  const viewUserDetails = (userId: string) => {
    router.push(`/users/${userId}`);
  };

  const openEdit = (u: UserRead) => {
    setCurrent(u);
    form.setFieldsValue({
      email: u.email || "",
      phone: u.phone || "",
      first_name: u.first_name || "",
      last_name: u.last_name || "",
      username: u.username || "",
      is_active: u.is_active,
      is_verified: u.is_verified,
    });
    setOpen(true);
  };

  const saveUser = async () => {
    try {
      const v = await form.validateFields();
      await usersApi.update(current!.id, v);
      message.success("Пользователь обновлен");
      setOpen(false);
      await load();
    } catch (e: any) {
      message.error(e.message || "Ошибка при обновлении пользователя");
    }
  };

  const resetPassword = async (u: UserRead) => {
    pwdForm.resetFields();
    Modal.confirm({
      title: "Сброс пароля",
      icon: <KeyOutlined />,
      content: (
        <Form form={pwdForm} layout="vertical">
          <Form.Item
            name="new_password"
            label="Новый пароль"
            rules={[
              { required: true, message: "Введите новый пароль" },
              { min: 8, message: "Минимум 8 символов" },
            ]}
          >
            <Input.Password placeholder="Новый пароль" />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        try {
          const v = await pwdForm.validateFields();
          await usersApi.resetPassword(u.id, v.new_password);
          message.success("Пароль сброшен");
        } catch (e: any) {
          message.error(e.message || "Ошибка при сбросе пароля");
        }
      },
    });
  };

  const addRole = async (u: UserRead) => {
    roleForm.resetFields();
    Modal.confirm({
      title: "Добавить роль пользователю",
      icon: <PlusOutlined />,
      content: (
        <Form form={roleForm} layout="vertical">
          <Form.Item
            name="role_id"
            label="Роль"
            rules={[{ required: true, message: "Выберите роль" }]}
          >
            <Select
              options={roles.map((r) => ({ label: r.name, value: r.id }))}
              placeholder="Выберите роль"
              showSearch
            />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        try {
          const v = await roleForm.validateFields();
          await usersApi.addRole(u.id, v.role_id);
          message.success("Роль добавлена");
          await load();
        } catch (e: any) {
          message.error(e.message || "Ошибка при добавлении роли");
        }
      },
    });
  };

  const removeUser = (u: UserRead) => {
    confirm({
      title: "Удалить пользователя?",
      icon: <ExclamationCircleOutlined />,
      content: "Действие необратимо.",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await usersApi.delete(u.id);
          message.success("Пользователь удален");
          await load();
        } catch (e: any) {
          message.error(e.message || "Ошибка при удалении пользователя");
        }
      },
    });
  };

  // Обработка поиска
  const handleSearch = (value: string) => {
    setSearchValue(value);
    setFilters(prev => ({ ...prev, search: value || undefined }));
    setCurrentPage(1);
  };

  // Обработка фильтров
  const handleFiltersChange = (changedValues: any, allValues: any) => {
    const newFilters: UserFilters = {
      ...filters,
      ...Object.fromEntries(
        Object.entries(allValues).filter(([_, value]) => value !== undefined && value !== '')
      )
    };
    setFilters(newFilters);
    setCurrentPage(1);
  };

  // Сброс фильтров
  const resetFilters = () => {
    filtersForm.resetFields();
    setFilters({});
    setSearchValue('');
    setCurrentPage(1);
  };

  // Обработка выбора из автодополнения
  const handleSuggestionSelect = (value: string, option: any) => {
    setSearchValue(option.email);
    handleSearch(option.email);
  };

  // Опции для автодополнения
  const suggestionOptions = suggestions.map(suggestion => ({
    value: suggestion.id,
    label: `${suggestion.email} - ${suggestion.name}`,
    email: suggestion.email,
  }));

  return (
    <Space direction="vertical" size="large" className="w-full">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>
            Пользователи
          </Title>
          <Text type="secondary">
            Управление пользователями, ролями и доступом
          </Text>
        </div>
      </div>

      {/* Фильтры и поиск */}
      <Card title="Поиск и фильтры" size="small">
        <Form 
          form={filtersForm}
          layout="vertical"
          onValuesChange={handleFiltersChange}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item label="Поиск">
                <AutoComplete
                  options={suggestionOptions}
                  onSelect={handleSuggestionSelect}
                  onSearch={loadSuggestions}
                  value={searchValue}
                  onChange={setSearchValue}
                >
                  <Input.Search
                    placeholder="Email, телефон, имя..."
                    onSearch={handleSearch}
                    allowClear
                    suffix={<SearchOutlined />}
                  />
                </AutoComplete>
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="is_active" label="Статус активности">
                <Select placeholder="Все" allowClear>
                  <Option value={true}>Активные</Option>
                  <Option value={false}>Неактивные</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="is_verified" label="Верификация">
                <Select placeholder="Все" allowClear>
                  <Option value={true}>Проверенные</Option>
                  <Option value={false}>Непроверенные</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="sort_by" label="Сортировка">
                <Select placeholder="По умолчанию" allowClear>
                  <Option value="created_at">По дате создания</Option>
                  <Option value="email">По email</Option>
                  <Option value="first_name">По имени</Option>
                  <Option value="last_name">По фамилии</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="sort_order" label="Порядок">
                <Select placeholder="По убыванию" allowClear>
                  <Option value="desc">По убыванию</Option>
                  <Option value="asc">По возрастанию</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={24} md={8} lg={6}>
              <Form.Item label=" ">
                <Space>
                  <Button 
                    icon={<ReloadOutlined />} 
                    onClick={() => load()}
                    loading={loading}
                  >
                    Обновить
                  </Button>
                  <Button onClick={resetFilters}>
                    Сбросить
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card>
        <Table<UserRead>
          rowKey="id"
          loading={loading}
          dataSource={data.items}
          pagination={{
            current: data.page,
            pageSize: data.size,
            total: data.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} из ${total} пользователей`,
            pageSizeOptions: ['10', '20', '50', '100'],
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size || 10);
            },
            onShowSizeChange: (current, size) => {
              setPageSize(size);
              setCurrentPage(1);
            }
          }}
          onRow={(record) => ({
            onClick: () => viewUserDetails(record.id),
            style: { cursor: 'pointer' },
          })}
          columns={[
            { 
              title: "ID", 
              dataIndex: "id", 
              minWidth: 220, 
              ellipsis: true,
              sorter: true,
            },
            { 
              title: "Email", 
              dataIndex: "email",
              sorter: true,
              ellipsis: true,
            },
            { 
              title: "Телефон", 
              dataIndex: "phone",
              ellipsis: true,
            },
            {
              title: "Имя",
              sorter: true,
              render: (_, r) =>
                `${r.first_name || ""} ${r.last_name || ""}`.trim() || "-",
            },
            {
              title: "Логин",
              dataIndex: "username",
              ellipsis: true,
            },
            {
              title: "Отдел",
              dataIndex: "department",
              ellipsis: true,
            },
            {
              title: "Статус",
              render: (_, r) => (
                <Space>
                  <Tag color={r.is_active ? "green" : "red"}>
                    {r.is_active ? "Активен" : "Неактивен"}
                  </Tag>
                  <Tag color={r.is_verified ? "green" : "orange"}>
                    {r.is_verified ? "Проверен" : "Не проверен"}
                  </Tag>
                </Space>
              ),
            },
            {
              title: "Действия",
              fixed: "right",
              width: 400,
              render: (_, r) => (
                <Space wrap>
                  <Button 
                    icon={<EyeOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      viewUserDetails(r.id);
                    }}
                  >
                    Детали
                  </Button>
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(r);
                    }}
                  >
                    Изменить
                  </Button>
                  <Button
                    icon={<KeyOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      resetPassword(r);
                    }}
                  >
                    Сброс пароля
                  </Button>
                  <Button 
                    icon={<PlusOutlined />} 
                    onClick={(e) => {
                      e.stopPropagation();
                      addRole(r);
                    }}
                  >
                    Роль
                  </Button>
                  <Button 
                    danger 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeUser(r);
                    }}
                  >
                    Удалить
                  </Button>
                </Space>
              ),
            },
          ]}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Drawer
        title="Редактирование пользователя"
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
            <Button type="primary" onClick={saveUser}>
              Сохранить
            </Button>
          </Space>
        }
      >
        <Form layout="vertical" form={form}>
          <Form.Item name="email" label="Email">
            <Input placeholder="user@example.com" />
          </Form.Item>
          <Form.Item name="phone" label="Телефон">
            <Input placeholder="+79998887766" />
          </Form.Item>
          <Form.Item name="username" label="Логин">
            <Input />
          </Form.Item>
          <Form.Item name="first_name" label="Имя">
            <Input />
          </Form.Item>
          <Form.Item name="last_name" label="Фамилия">
            <Input />
          </Form.Item>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="is_active" label="Активен" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item
              name="is_verified"
              label="Проверен"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </div>
        </Form>
      </Drawer>
    </Space>
  );
}