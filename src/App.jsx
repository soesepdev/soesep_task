import React, { useState, useEffect } from 'react';
import {
  Table, Tag, Space, Button, Modal, Form, Input,
  Select, DatePicker, Row, Col, message
} from 'antd';
import {
  CheckCircleOutlined, ClockCircleOutlined, MinusCircleOutlined,
  ExclamationCircleOutlined, SyncOutlined, EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';

const { Option } = Select;
const { confirm } = Modal;

const MAIN_BIN_ID = '682c44bf8960c979a59d8006';
// const HISTORY_BIN_ID = '682c44da8a456b7966a1be34';
const JSONBIN_API = 'https://api.jsonbin.io/v3/b';
const ACCESS_KEY = '$2a$10$E8n0tBaz.zWHVc4S9UDEkO3UTGM2Ir0XxuiLYYkJf1TZz8Z0QMvjC';

const axiosConfig = {
  headers: {
    'X-Access-Key': ACCESS_KEY,
    'Content-Type': 'application/json'
  }
};

const statusOptions = [
  { value: 'completed', label: 'Completed' },
  { value: 'in progress', label: 'In Progress' },
  { value: 'pending', label: 'Pending' },
  { value: 'not started', label: 'Not started' },
];

const projectOptions = ['MyGraPARI', 'OM'];

const App = () => {
  const [data, setData] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterProject, setFilterProject] = useState(null);
  const [loading, setLoading] = useState(false);

  // pagination page size
  const [pageSize, setPageSize] = useState(10);

  // loading button states
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deletingKey, setDeletingKey] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${JSONBIN_API}/${MAIN_BIN_ID}`, axiosConfig);
      const items = res.data.record || [];
      setData(items.map((item, idx) => ({ ...item, key: idx })));
    } catch (err) {
      console.error(err);
      message.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const saveData = async (newData) => {
    try {
      await axios.put(`${JSONBIN_API}/${MAIN_BIN_ID}`, newData, axiosConfig);
      fetchData();
    } catch (err) {
      console.error(err);
      message.error('Failed to save data');
    }
  };

  const handleOk = () => {
    form.validateFields().then(async (values) => {
      setSubmitLoading(true);
      const newTask = {
        ...values,
        deadline: values.deadline.format('YYYY-MM-DD')
      };
      let newData;
      if (editingTask !== null) {
        newData = [...data];
        newData[editingTask.key] = newTask;
        message.success('Task updated');
      } else {
        newData = [...data, newTask];
        message.success('Task created');
      }
      setModalOpen(false);
      setEditingTask(null);
      form.resetFields();
      await saveData(newData);
      setSubmitLoading(false);
    }).catch(() => {
      setSubmitLoading(false);
    });
  };

  const handleDelete = (record) => {
    confirm({
      title: `Delete task "${record.name}"?`,
      okType: 'danger',
      onOk: async () => {
        setDeletingKey(record.key);
        const newData = data.filter((_, idx) => idx !== record.key);
        await saveData(newData);
        setDeletingKey(null);
        message.success('Deleted');
      },
      onCancel() {
        setDeletingKey(null);
      }
    });
  };

  const openEditModal = (record) => {
    setEditingTask(record);
    form.setFieldsValue({
      ...record,
      deadline: dayjs(record.deadline)
    });
    setModalOpen(true);
  };

  const columns = [
    {
      title: 'No',
      render: (_, __, index) => index + 1,
      width: 50
    },
    { title: 'Name', dataIndex: 'name' },
    { title: 'Description', dataIndex: 'description' },
    { title: 'Project', dataIndex: 'project' },
    { title: 'Deadline', dataIndex: 'deadline' },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status) => {
        let color = 'default';
        let icon = null;
        switch (status) {
          case 'completed': color = 'green'; icon = <CheckCircleOutlined />; break;
          case 'in progress': color = 'blue'; icon = <SyncOutlined spin />; break;
          case 'pending': color = 'orange'; icon = <ClockCircleOutlined />; break;
          case 'not started': color = 'cyan'; icon = <ExclamationCircleOutlined />; break;
          default: color = 'red'; icon = <MinusCircleOutlined />;
        }
        return <Tag icon={icon} color={color}>{status.toUpperCase()}</Tag>;
      }
    },
    { title: 'Note', dataIndex: 'note' },
    {
      title: 'Action',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEditModal(record)} />
          <Button
            icon={<DeleteOutlined />}
            danger
            loading={deletingKey === record.key}
            onClick={() => handleDelete(record)}
          />
        </Space>
      )
    }
  ];

  // Filter data including searchText (search all columns), filterStatus, filterProject
  const filteredData = data.filter(item => {
    const searchLower = searchText.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(searchLower) ||
      item.description.toLowerCase().includes(searchLower) ||
      item.project.toLowerCase().includes(searchLower) ||
      item.status.toLowerCase().includes(searchLower) ||
      (item.note ? item.note.toLowerCase().includes(searchLower) : false);

    const matchesStatus = filterStatus ? item.status === filterStatus : true;
    const matchesProject = filterProject ? item.project === filterProject : true;

    return matchesSearch && matchesStatus && matchesProject;
  });

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Input
            placeholder="Search..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
          />
        </Col>

        <Col span={6}>
          <Select
            placeholder="Filter by status"
            value={filterStatus}
            onChange={setFilterStatus}
            allowClear
            style={{ width: '100%' }}
          >
            {statusOptions.map(opt => (
              <Option key={opt.value} value={opt.value}>{opt.label}</Option>
            ))}
          </Select>
        </Col>

        <Col span={4}>
          <Select
            placeholder="Filter by project"
            value={filterProject}
            onChange={setFilterProject}
            allowClear
            style={{ width: '100%' }}
          >
            {projectOptions.map(proj => (
              <Option key={proj} value={proj}>{proj}</Option>
            ))}
          </Select>
        </Col>

        <Col span={4}>
          <Select
            value={pageSize}
            onChange={setPageSize}
            style={{ width: 120 }}
          >
            {[5, 10, 20, 50].map(size => (
              <Option key={size} value={size}>
                Show {size}
              </Option>
            ))}
          </Select>
        </Col>

        <Col span={4} style={{ textAlign: 'right' }}>
          <Button
            type="primary"
            onClick={() => {
              setModalOpen(true);
              form.resetFields();
              setEditingTask(null);
            }}
          >
            Create
          </Button>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="key"
        pagination={{ pageSize }}
        loading={loading}
        scroll={{ x: 1000 }}
      />

      <Modal
        open={modalOpen}
        title={editingTask ? 'Edit Task' : 'Create Task'}
        onCancel={() => setModalOpen(false)}
        onOk={handleOk}
        confirmLoading={submitLoading}
      >
        <Form form={form} layout="vertical" initialValues={{ status: 'not started' }}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="project" label="Project" rules={[{ required: true }]}>
            <Select>
              {projectOptions.map(proj => (
                <Option key={proj} value={proj}>{proj}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="deadline" label="Deadline" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select>
              {statusOptions.map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="note" label="Note">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default App;