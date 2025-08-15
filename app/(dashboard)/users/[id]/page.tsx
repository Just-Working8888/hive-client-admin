"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Button,
  Card,
  Space,
  Typography,
  Tag,
  Avatar,
  Skeleton,
  Row,
  Col,
  Alert,
  message,
  Modal,
  Form,
  Input,
  Switch,
  Select,
  Breadcrumb,
  Divider,
  Badge,
  Tooltip,
  Flex,
  Descriptions,
  Statistic,
} from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
  EditOutlined,
  KeyOutlined,
  PlusOutlined,
  CalendarOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  TeamOutlined,
  SafetyOutlined,
  GlobalOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CrownOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { usersApi, rolesApi } from "@/shared/api/endpoints";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ru";
import { Camera } from "lucide-react";
import { get } from "lodash";

dayjs.extend(relativeTime);
dayjs.locale("ru");

const { Title, Text } = Typography;
const { confirm } = Modal;
const { Option } = Select;

type UserDetail = {
  id: string;
  email: string | null;
  phone: string | null;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  is_verified: boolean;
  is_admin: boolean;
  position: string | null;
  department: string | null;
  profile_picture: string | null;
  auth_provider: string;
  created_at: string;
  updated_at: string;
  google_id: string | null;
};

type RoleRead = {
  id: number;
  name: string;
  description?: string | null;
};

export default function UserDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [roles, setRoles] = useState<RoleRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);

  const [editForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [roleForm] = Form.useForm();

  const loadUser = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await usersApi.getById(userId);
      setUser(response.data);
    } catch (e: any) {
      message.error(e.message || "Не удалось загрузить данные пользователя");
      router.push("/users");
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

  useEffect(() => {
    loadUser();
    loadRoles();
  }, [userId]);

  const handleEdit = async () => {
    try {
      const values = await editForm.validateFields();
      await usersApi.update(userId, values);
      message.success("Пользователь обновлен");
      setEditModalOpen(false);
      await loadUser();
    } catch (e: any) {
      message.error(e.message || "Ошибка при обновлении пользователя");
    }
  };

  const handlePasswordReset = async () => {
    try {
      const values = await passwordForm.validateFields();
      await usersApi.resetPassword(userId, values.new_password);
      message.success("Пароль сброшен");
      setPasswordModalOpen(false);
      passwordForm.resetFields();
    } catch (e: any) {
      message.error(e.message || "Ошибка при сбросе пароля");
    }
  };

  const handleAddRole = async () => {
    try {
      const values = await roleForm.validateFields();
      await usersApi.addRole(userId, values.role_id);
      message.success("Роль добавлена");
      setRoleModalOpen(false);
      roleForm.resetFields();
      await loadUser();
    } catch (e: any) {
      message.error(e.message || "Ошибка при добавлении роли");
    }
  };

  const handleDelete = () => {
    confirm({
      title: "Удалить пользователя?",
      icon: <ExclamationCircleOutlined />,
      content: "Действие необратимо. Все данные пользователя будут удалены.",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await usersApi.delete(userId);
          message.success("Пользователь удален");
          router.push("/users");
        } catch (e: any) {
          message.error(e.message || "Ошибка при удалении пользователя");
        }
      },
    });
  };

  const openEditModal = () => {
    if (!user) return;

    editForm.setFieldsValue({
      email: user.email || "",
      phone: user.phone || "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      username: user.username || "",
      position: user.position || "",
      department: user.department || "",
      is_active: user.is_active,
      is_verified: user.is_verified,
      is_admin: user.is_admin,
    });
    setEditModalOpen(true);
  };

  const getFullName = (user: UserDetail) => {
    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    return (
      fullName || user.username || user.email || "Неизвестный пользователь"
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
          <Skeleton.Button active size="large" />
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <Row gutter={[32, 32]}>
              <Col xs={24} lg={8}>
                <div className="text-center space-y-4">
                  <Skeleton.Avatar active size={120} />
                  <Skeleton active paragraph={{ rows: 3 }} />
                </div>
              </Col>
              <Col xs={24} lg={16}>
                <Skeleton active paragraph={{ rows: 8 }} />
              </Col>
            </Row>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <Alert
            message="Пользователь не найден"
            description="Возможно, пользователь был удален или у вас нет прав для его просмотра."
            type="error"
            showIcon
            action={
              <Button type="primary" onClick={() => router.push("/users")}>
                Вернуться к списку
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Breadcrumb
            items={[
              {
                title: (
                  //   <Button
                  //     type="link"
                  //     icon={}
                  //     onClick={() => router.push("/users")}
                  //     className="p-0 h-auto"
                  //   >
                  <a href="/users">
                    <ArrowLeftOutlined /> Пользователи
                  </a>
                  //   </Button>
                ),
              },
              { title: getFullName(user) },
            ]}
          />
        </div>

        <Space wrap>
          <Button icon={<EditOutlined />} onClick={openEditModal}>
            Редактировать
          </Button>
          <Button
            icon={<KeyOutlined />}
            onClick={() => setPasswordModalOpen(true)}
          >
            Сбросить пароль
          </Button>
          <Button
            icon={<PlusOutlined />}
            onClick={() => setRoleModalOpen(true)}
          >
            Добавить роль
          </Button>
          <Button danger onClick={handleDelete}>
            Удалить
          </Button>
        </Space>
      </div>
      <br />
      {/* Main Content */}
      <div className="space-y-6">
        {/* Profile Header Card */}

        <Card className="mb-6 border-0 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <div className="relative">
              <Avatar
                size={80}
                style={{ background: "#5eb487" }}
                className="text-2xl font-semibold"
                src={user.profile_picture || undefined}
              />
            </div>

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                    {getFullName(user)}
                  </h2>
                  <p className="text-gray-600 mt-1">{user.id}</p>
                  <div className="flex items-center space-x-3 mt-2">
                    <Tag color={user.is_active ? "green" : "red"}>
                      {user.is_active ? "Активен" : "Не активен"}
                    </Tag>
                    <Tag color={user.is_verified ? "blue" : "orange"}>
                      {user.is_verified ? "Подтвержден" : "Не подтвержден"}
                    </Tag>
                    {user.department && (
                      <Tag color="purple" className="capitalize">
                        {user.department}
                      </Tag>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
        <br />
        {/* Information Cards */}
        <Row gutter={[24, 24]}>
          {/* Contact Information */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <MailOutlined className="text-blue-600" />
                  <span>Контактная информация</span>
                </Space>
              }
              className="h-full shadow-sm border-0"
            >
              <div className="space-y-6">
                {/* Email */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <MailOutlined className="text-gray-500 mt-1" />
                  <div className="flex-1 min-w-0">
                    <Text type="secondary" className="text-sm">
                      Email адрес
                    </Text>
                    <div className="mt-1">
                      {user.email ? (
                        <a
                          href={`mailto:${user.email}`}
                          className="text-blue-600 hover:text-blue-800 font-medium break-all"
                        >
                          {user.email}
                        </a>
                      ) : (
                        <Text type="secondary">Не указан</Text>
                      )}
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <PhoneOutlined className="text-gray-500 mt-1" />
                  <div className="flex-1 min-w-0">
                    <Text type="secondary" className="text-sm">
                      Номер телефона
                    </Text>
                    <div className="mt-1">
                      {user.phone ? (
                        <a
                          href={`tel:${user.phone}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {user.phone}
                        </a>
                      ) : (
                        <Text type="secondary">Не указан</Text>
                      )}
                    </div>
                  </div>
                </div>

                {/* Username */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <IdcardOutlined className="text-gray-500 mt-1" />
                  <div className="flex-1 min-w-0">
                    <Text type="secondary" className="text-sm">
                      Логин
                    </Text>
                    <div className="mt-1">
                      {user.username ? (
                        <Text strong className="font-mono">
                          @{user.username}
                        </Text>
                      ) : (
                        <Text type="secondary">Не задан</Text>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Col>

          {/* Work Information */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <TeamOutlined className="text-green-600" />
                  <span>Рабочая информация</span>
                </Space>
              }
              className="h-full shadow-sm border-0"
            >
              <div className="space-y-6">
                {/* Position */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <IdcardOutlined className="text-gray-500 mt-1" />
                  <div className="flex-1">
                    <Text type="secondary" className="text-sm">
                      Должность
                    </Text>
                    <div className="mt-1">
                      {user.position ? (
                        <Text strong>{user.position}</Text>
                      ) : (
                        <Text type="secondary">Не указана</Text>
                      )}
                    </div>
                  </div>
                </div>

                {/* Department */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <EnvironmentOutlined className="text-gray-500 mt-1" />
                  <div className="flex-1">
                    <Text type="secondary" className="text-sm">
                      Отдел
                    </Text>
                    <div className="mt-1">
                      {user.department ? (
                        <Text strong>{user.department}</Text>
                      ) : (
                        <Text type="secondary">Не указан</Text>
                      )}
                    </div>
                  </div>
                </div>

                {/* Auth Provider */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  {user.auth_provider === "google" ? (
                    <GlobalOutlined className="text-gray-500 mt-1" />
                  ) : (
                    <SafetyOutlined className="text-gray-500 mt-1" />
                  )}
                  <div className="flex-1">
                    <Text type="secondary" className="text-sm">
                      Способ входа
                    </Text>
                    <div className="mt-1">
                      <Text strong>
                        {user.auth_provider === "google"
                          ? "Google аккаунт"
                          : "Локальный аккаунт"}
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* System Information */}
        <Card
          title={
            <Space>
              <ClockCircleOutlined className="text-purple-600" />
              <span>Системная информация</span>
            </Space>
          }
          className="shadow-sm border-0"
        >
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} md={8}>
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <CalendarOutlined className="text-2xl text-blue-600 mb-3" />
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {dayjs().diff(dayjs(user.created_at), "day")}
                </div>
                <Text type="secondary">дней с регистрации</Text>
                <div className="mt-2 text-xs text-gray-500">
                  {dayjs(user.created_at).format("DD.MM.YYYY HH:mm")}
                </div>
              </div>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <ClockCircleOutlined className="text-2xl text-green-600 mb-3" />
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {dayjs(user.updated_at).fromNow()}
                </div>
                <Text type="secondary">последнее обновление</Text>
                <div className="mt-2 text-xs text-gray-500">
                  {dayjs(user.updated_at).format("DD.MM.YYYY HH:mm")}
                </div>
              </div>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <div className="text-center p-6 bg-purple-50 rounded-lg">
                <IdcardOutlined className="text-2xl text-purple-600 mb-3" />
                <div className="text-2xl font-bold text-gray-900 mb-1">ID</div>
                <div className="text-sm font-mono text-gray-900 mb-1 break-all">
                  {user.id}
                </div>
                <Text type="secondary">идентификатор</Text>
              </div>
            </Col>
          </Row>
        </Card>
      </div>

      {/* Modals */}

      {/* Edit Modal */}
      <Modal
        title="Редактирование профиля"
        open={editModalOpen}
        onOk={handleEdit}
        onCancel={() => setEditModalOpen(false)}
        width={700}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Form form={editForm} layout="vertical" className="mt-4">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="first_name" label="Имя">
                <Input placeholder="Введите имя" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="last_name" label="Фамилия">
                <Input placeholder="Введите фамилию" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="email" label="Email">
                <Input placeholder="user@example.com" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="phone" label="Телефон">
                <Input placeholder="+7 999 888 77 66" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="username" label="Логин">
                <Input placeholder="username" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="position" label="Должность">
                <Input placeholder="Ваша должность" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="department" label="Отдел">
            <Input placeholder="Название отдела" />
          </Form.Item>

          <Divider />

          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="is_active"
                label="Активный аккаунт"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="is_verified"
                label="Подтвержденный"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="is_admin"
                label="Администратор"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Password Reset Modal */}
      <Modal
        title="Смена пароля"
        open={passwordModalOpen}
        onOk={handlePasswordReset}
        onCancel={() => {
          setPasswordModalOpen(false);
          passwordForm.resetFields();
        }}
        okText="Сменить пароль"
        cancelText="Отмена"
      >
        <Form form={passwordForm} layout="vertical" className="mt-4">
          <Alert
            message="Внимание"
            description="После смены пароля пользователь будет принудительно разлогинен из всех устройств."
            type="warning"
            showIcon
            className="mb-4"
          />
          <Form.Item
            name="new_password"
            label="Новый пароль"
            rules={[
              { required: true, message: "Введите новый пароль" },
              { min: 8, message: "Пароль должен содержать минимум 8 символов" },
            ]}
          >
            <Input.Password placeholder="Введите новый пароль" size="large" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Role Modal */}
      <Modal
        title="Добавление роли"
        open={roleModalOpen}
        onOk={handleAddRole}
        onCancel={() => {
          setRoleModalOpen(false);
          roleForm.resetFields();
        }}
        okText="Добавить роль"
        cancelText="Отмена"
      >
        <Form form={roleForm} layout="vertical" className="mt-4">
          <Form.Item
            name="role_id"
            label="Выберите роль"
            rules={[
              { required: true, message: "Выберите роль для добавления" },
            ]}
          >
            <Select
              options={roles.map((r) => ({ label: r.name, value: r.id }))}
              placeholder="Выберите роль из списка"
              showSearch
              size="large"
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
