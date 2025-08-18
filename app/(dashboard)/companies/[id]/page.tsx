"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Button,
  Card,
  Spin,
  Typography,
  Tag,
  Space,
  Row,
  Col,
  Statistic,
  Timeline,
  Empty,
  message,
  Breadcrumb,
  Divider,
  Avatar,
  Tooltip,
  Badge,
  Table,
} from "antd";
import {
  ArrowLeftOutlined,
  BuildOutlined,
  TeamOutlined,
  EditOutlined,
  HistoryOutlined,
  UserOutlined,
  CrownOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { companiesApi } from "@/shared/api/endpoints";

const { Title, Text, Paragraph } = Typography;

type CompanyDetails = {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
  members_count?: number;
  services_count?: number;
  user_role?: string;
  user_membership_status?: string;
  services?: any[];
  recent_activity?: Array<{
    action: string;
    timestamp: string;
    description: string;
  }>;
};

export default function CompanyDetailsPage() {
  const params = useParams();
  const companyId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<CompanyDetails | null>(null);

  const loadCompanyDetails = async () => {
    if (!companyId) return;

    setLoading(true);
    try {
      const response = await companiesApi.getById(companyId);
      setCompany(response.data);
    } catch (error: any) {
      message.error(error.message || "Не удалось загрузить данные компании");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanyDetails();
  }, [companyId]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelativeTime = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Сегодня";
    if (diffDays === 1) return "Вчера";
    if (diffDays < 7) return `${diffDays} дн. назад`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} нед. назад`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} мес. назад`;
    return `${Math.floor(diffDays / 365)} г. назад`;
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "green";
      case "pending":
        return "orange";
      case "suspended":
        return "red";
      default:
        return "default";
    }
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "company_created":
        return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
      case "company_updated":
        return <EditOutlined style={{ color: "#1890ff" }} />;
      case "member_joined":
        return <UserOutlined style={{ color: "#52c41a" }} />;
      case "member_left":
        return <StopOutlined style={{ color: "#ff4d4f" }} />;
      default:
        return <ClockCircleOutlined style={{ color: "#d9d9d9" }} />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Empty description="Компания не найдена" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <Breadcrumb className="mb-4">
          <Breadcrumb.Item>
            <ArrowLeftOutlined />
            <span className="ml-2">Компании</span>
          </Breadcrumb.Item>
          <Breadcrumb.Item>{company.name}</Breadcrumb.Item>
        </Breadcrumb>
        <br />
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="min-w-0">
                  <Title level={2} className="!mb-0 !text-2xl lg:!text-3xl">
                    {company.name}
                  </Title>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {company.user_role && (
                      <Tag color="blue" icon={<CrownOutlined />}>
                        {company.user_role === "admin"
                          ? "Администратор"
                          : company.user_role === "manager"
                          ? "Менеджер"
                          : "Участник"}
                      </Tag>
                    )}
                    {company.user_membership_status && (
                      <Tag
                        color={getStatusColor(company.user_membership_status)}
                      >
                        {company.user_membership_status === "active"
                          ? "Активен"
                          : company.user_membership_status === "pending"
                          ? "Ожидает"
                          : company.user_membership_status}
                      </Tag>
                    )}
                  </div>
                </div>
              </div>

              {company.description && (
                <Paragraph className="text-gray-600 mb-0 mt-3">
                  {company.description}
                </Paragraph>
              )}
            </div>

            <div className="flex gap-2">
              <Button icon={<EditOutlined />}>Редактировать</Button>
            </div>
          </div>
        </div>

        {/* Статистика */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card className="text-center h-full">
              <Statistic
                title="Участников"
                value={company.members_count || 0}
                prefix={<TeamOutlined className="text-blue-500" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="text-center h-full">
              <Statistic
                title="Сервисов"
                value={company.services_count || 0}
                prefix={<BuildOutlined className="text-green-500" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="text-center h-full">
              <div className="text-sm text-gray-500 mb-2">Создана</div>
              <div className="text-2xl font-semibold text-gray-900">
                {formatRelativeTime(company.created_at)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {formatDate(company.created_at)}
              </div>
            </Card>
          </Col>
          {/* <Col xs={24} sm={12} lg={6}>
            <Card className="text-center h-full">
              <div className="text-sm text-gray-500 mb-2">Обновлена</div>
              <div className="text-2xl font-semibold text-gray-900">
                {formatRelativeTime(company.updated_at)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {formatDate(company.updated_at)}
              </div>
            </Card>
          </Col> */}
        </Row>

        <Row gutter={[24, 24]}>
          {/* Левая колонка */}
          <Col xs={24} lg={16}>
            <Space direction="vertical" size="large" className="w-full">
              {/* Информация о компании */}
              <Card
                title={
                  <div className="flex items-center gap-2">
                    <BuildOutlined />
                    Информация о компании
                  </div>
                }
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <div className="space-y-4">
                      <div>
                        <Text strong className="block mb-1">
                          ID компании
                        </Text>
                        <Text code className="text-xs">
                          {company.id}
                        </Text>
                      </div>
                      <div>
                        <Text strong className="block mb-1">
                          Название
                        </Text>
                        <Text>{company.name}</Text>
                      </div>
                      {company.description && (
                        <div>
                          <Text strong className="block mb-1">
                            Описание
                          </Text>
                          <Paragraph ellipsis={{ rows: 3, expandable: true }}>
                            {company.description}
                          </Paragraph>
                        </div>
                      )}
                    </div>
                  </Col>
                  <Col xs={24} sm={12}>
                    <div className="space-y-4">
                      <div>
                        <Text strong className="block mb-1">
                          Дата создания
                        </Text>
                        <div>
                          <Text>{formatDate(company.created_at)}</Text>
                          <br />
                          <Text type="secondary" className="text-sm">
                            ({formatRelativeTime(company.created_at)})
                          </Text>
                        </div>
                      </div>
                      <div>
                        <Text strong className="block mb-1">
                          Последнее обновление
                        </Text>
                        <div>
                          <Text>{formatDate(company.updated_at)}</Text>
                          <br />
                          <Text type="secondary" className="text-sm">
                            ({formatRelativeTime(company.updated_at)})
                          </Text>
                        </div>
                      </div>
                      {company.user_role && (
                        <div>
                          <Text strong className="block mb-1">
                            Ваша роль
                          </Text>
                          <Tag color="blue" icon={<CrownOutlined />}>
                            {company.user_role}
                          </Tag>
                        </div>
                      )}
                    </div>
                  </Col>
                </Row>
              </Card>

              {/* Сервисы */}
              <Card
                title={
                  <div className="flex items-center gap-2">
                    <BuildOutlined />
                    Сервисы
                    <Badge count={company.services?.length || 0} showZero />
                  </div>
                }
              >
                {company.services && company.services.length > 0 ? (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {company.services.map((service: any, index: number) => (
                      <Card
                        key={index}
                        size="small"
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        hoverable
                      >
                        <div className="text-center">
                          <Avatar
                            size={48}
                            icon={<BuildOutlined />}
                            className="bg-green-500 mb-2"
                          />
                          <Title level={5} className="!mb-1">
                            {service.name || `Сервис ${index + 1}`}
                          </Title>
                          <Text type="secondary" className="text-sm">
                            {service.description || "Описание отсутствует"}
                          </Text>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Сервисы отсутствуют"
                    className="py-8"
                  />
                )}
              </Card>
            </Space>
          </Col>

          {/* Правая колонка */}
          <Col xs={24} lg={8}>
            <Space direction="vertical" size="large" className="w-full">
              {/* История активности */}
              <Card
                title={
                  <div className="flex items-center gap-2">
                    <HistoryOutlined />
                    Недавняя активность
                  </div>
                }
              >
                {company.recent_activity &&
                company.recent_activity.length > 0 ? (
                  <Timeline
                    items={company.recent_activity.map((activity, index) => ({
                      dot: getActivityIcon(activity.action),
                      children: (
                        <div key={index}>
                          <div className="font-medium text-gray-900 mb-1">
                            {activity.description}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(activity.timestamp)}
                            <Text type="secondary" className="ml-2">
                              ({formatRelativeTime(activity.timestamp)})
                            </Text>
                          </div>
                        </div>
                      ),
                    }))}
                  />
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Активность отсутствует"
                    className="py-4"
                  />
                )}
              </Card>

              <Card title="Статистика">
                <div className="space-y-3">
                  {company.members_count !== undefined && (
                    <div className="flex justify-between items-center">
                      <Text>Участников:</Text>
                      <Text strong>{company.members_count}</Text>
                    </div>
                  )}
                  {company.services_count !== undefined && (
                    <div className="flex justify-between items-center">
                      <Text>Сервисов:</Text>
                      <Text strong>{company.services_count}</Text>
                    </div>
                  )}
                  <Divider className="my-3" />
                  <div className="flex justify-between items-center">
                    <Text type="secondary">ID:</Text>
                    <Tooltip title="Скопировать ID">
                      <Text
                        code
                        className="text-xs cursor-pointer hover:bg-gray-100 px-1 rounded"
                        onClick={() => {
                          navigator.clipboard.writeText(company.id);
                          message.success("ID скопирован");
                        }}
                      >
                        {company.id.substring(0, 8)}...
                      </Text>
                    </Tooltip>
                  </div>
                </div>
              </Card>
            </Space>
          </Col>
        </Row>
      </div>
    </div>
  );
}
