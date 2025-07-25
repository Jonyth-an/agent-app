// 导入React核心库
import React from 'react';
// 导入ReactFlow库及其类型定义，用于构建流程图
import ReactFlow, { NodeProps, SelectionMode } from 'reactflow';
// 导入Chakra UI组件库的相关组件
import { Box, IconButton, useDisclosure } from '@chakra-ui/react';
// 导入Chakra UI图标
import { SmallCloseIcon } from '@chakra-ui/icons';
// 导入边缘类型和流程节点类型枚举
import { EDGE_TYPE, FlowNodeTypeEnum } from '@fastgpt/global/core/workflow/node/constant';

// 导入Next.js的动态导入功能，用于代码分割和懒加载
import dynamic from 'next/dynamic';

// 导入自定义边缘组件
import ButtonEdge from './components/ButtonEdge';
// 导入节点模板模态框组件
import NodeTemplatesModal from './NodeTemplatesModal';

// 导入ReactFlow的样式
import 'reactflow/dist/style.css';
// 导入流程节点项类型定义
import { FlowNodeItemType } from '@fastgpt/global/core/workflow/type/node.d';
// 导入连接线样式、默认边缘选项、最大/最小缩放级别等常量
import { connectionLineStyle, defaultEdgeOptions, maxZoom, minZoom } from '../constants';
// 导入上下文选择器钩子
import { useContextSelector } from 'use-context-selector';
// 导入工作流自定义钩子
import { useWorkflow } from './hooks/useWorkflow';
// 导入辅助线组件
import HelperLines from './components/HelperLines';
// 导入流程控制器组件
import FlowController from './components/FlowController';
// 导入上下文菜单组件
import ContextMenu from './components/ContextMenu';
// 导入工作流节点边缘上下文和初始化上下文
import { WorkflowNodeEdgeContext, WorkflowInitContext } from '../context/workflowInitContext';
// 导入工作流事件上下文
import { WorkflowEventContext } from '../context/workflowEventContext';

// 动态导入简单节点组件，实现代码分割和按需加载
const NodeSimple = dynamic(() => import('./nodes/NodeSimple'));
// 定义节点类型映射，将节点类型枚举映射到对应的React组件
const nodeTypes: Record<FlowNodeTypeEnum, any> = {
  // 空节点使用简单节点组件
  [FlowNodeTypeEnum.emptyNode]: NodeSimple,
  // 全局变量节点使用简单节点组件
  [FlowNodeTypeEnum.globalVariable]: NodeSimple,
  // 文本编辑器节点使用简单节点组件
  [FlowNodeTypeEnum.textEditor]: NodeSimple,
  // 自定义反馈节点使用简单节点组件
  [FlowNodeTypeEnum.customFeedback]: NodeSimple,
  // 系统配置节点使用动态导入的专用组件
  [FlowNodeTypeEnum.systemConfig]: dynamic(() => import('./nodes/NodeSystemConfig')),
  // 插件配置节点使用动态导入的专用组件
  [FlowNodeTypeEnum.pluginConfig]: dynamic(() => import('./nodes/NodePluginIO/NodePluginConfig')),
  // 工作流起始节点使用动态导入的专用组件
  [FlowNodeTypeEnum.workflowStart]: dynamic(() => import('./nodes/NodeWorkflowStart')),
  // 聊天节点使用简单节点组件
  [FlowNodeTypeEnum.chatNode]: NodeSimple,
  // 读取文件节点使用简单节点组件
  [FlowNodeTypeEnum.readFiles]: NodeSimple,
  // 数据集搜索节点使用简单节点组件
  [FlowNodeTypeEnum.datasetSearchNode]: NodeSimple,
  // 数据集连接节点使用动态导入的专用组件
  [FlowNodeTypeEnum.datasetConcatNode]: dynamic(() => import('./nodes/NodeDatasetConcat')),
  // 回答节点使用动态导入的专用组件
  [FlowNodeTypeEnum.answerNode]: dynamic(() => import('./nodes/NodeAnswer')),
  // 问题分类节点使用动态导入的专用组件
  [FlowNodeTypeEnum.classifyQuestion]: dynamic(() => import('./nodes/NodeCQNode')),
  // 内容提取节点使用动态导入的专用组件
  [FlowNodeTypeEnum.contentExtract]: dynamic(() => import('./nodes/NodeExtract')),
  // HTTP请求节点使用动态导入的专用组件
  [FlowNodeTypeEnum.httpRequest468]: dynamic(() => import('./nodes/NodeHttp')),
  // 运行应用节点使用简单节点组件
  [FlowNodeTypeEnum.runApp]: NodeSimple,
  // 应用模块节点使用简单节点组件
  [FlowNodeTypeEnum.appModule]: NodeSimple,
  // 插件输入节点使用动态导入的专用组件
  [FlowNodeTypeEnum.pluginInput]: dynamic(() => import('./nodes/NodePluginIO/PluginInput')),
  // 插件输出节点使用动态导入的专用组件
  [FlowNodeTypeEnum.pluginOutput]: dynamic(() => import('./nodes/NodePluginIO/PluginOutput')),
  // 插件模块节点使用简单节点组件
  [FlowNodeTypeEnum.pluginModule]: NodeSimple,
  // 查询扩展节点使用简单节点组件
  [FlowNodeTypeEnum.queryExtension]: NodeSimple,
  // 工具节点使用动态导入的专用组件
  [FlowNodeTypeEnum.tools]: dynamic(() => import('./nodes/NodeTools')),
  // 停止工具节点使用带有自定义宽度的简单节点组件
  [FlowNodeTypeEnum.stopTool]: (data: NodeProps<FlowNodeItemType>) => (
    <NodeSimple {...data} minW={'100px'} maxW={'300px'} />
  ),
  // 工具参数节点使用动态导入的专用组件
  [FlowNodeTypeEnum.toolParams]: dynamic(() => import('./nodes/NodeToolParams')),
  // Laf模块节点使用动态导入的专用组件
  [FlowNodeTypeEnum.lafModule]: dynamic(() => import('./nodes/NodeLaf')),
  // 条件判断节点使用动态导入的专用组件
  [FlowNodeTypeEnum.ifElseNode]: dynamic(() => import('./nodes/NodeIfElse')),
  // 变量更新节点使用动态导入的专用组件
  [FlowNodeTypeEnum.variableUpdate]: dynamic(() => import('./nodes/NodeVariableUpdate')),
  // 代码节点使用动态导入的专用组件
  [FlowNodeTypeEnum.code]: dynamic(() => import('./nodes/NodeCode')),
  // 用户选择节点使用动态导入的专用组件
  [FlowNodeTypeEnum.userSelect]: dynamic(() => import('./nodes/NodeUserSelect')),
  // 循环节点使用动态导入的专用组件
  [FlowNodeTypeEnum.loop]: dynamic(() => import('./nodes/Loop/NodeLoop')),
  // 循环开始节点使用动态导入的专用组件
  [FlowNodeTypeEnum.loopStart]: dynamic(() => import('./nodes/Loop/NodeLoopStart')),
  // 循环结束节点使用动态导入的专用组件
  [FlowNodeTypeEnum.loopEnd]: dynamic(() => import('./nodes/Loop/NodeLoopEnd')),
  // 表单输入节点使用动态导入的专用组件
  [FlowNodeTypeEnum.formInput]: dynamic(() => import('./nodes/NodeFormInput')),
  // 注释节点使用动态导入的专用组件
  [FlowNodeTypeEnum.comment]: dynamic(() => import('./nodes/NodeComment'))
};
// 定义边缘类型映射，将边缘类型映射到对应的React组件
const edgeTypes = {
  // 使用自定义的ButtonEdge组件作为边缘渲染器
  [EDGE_TYPE]: ButtonEdge
};

// 定义工作流组件
const Workflow = () => {
  // 从工作流初始化上下文中获取节点数据
  const nodes = useContextSelector(WorkflowInitContext, (v) => v.nodes);
  // 从工作流节点边缘上下文中获取边缘数据
  const edges = useContextSelector(WorkflowNodeEdgeContext, (v) => v.edges);
  // 从工作流事件上下文中获取ReactFlow包装器引用
  const reactFlowWrapper = useContextSelector(WorkflowEventContext, (v) => v.reactFlowWrapper);
  // 从工作流事件上下文中获取工作流控制模式
  const workflowControlMode = useContextSelector(
    WorkflowEventContext,
    (v) => v.workflowControlMode
  );

  // 使用自定义工作流钩子获取各种事件处理函数
  const {
    // 处理节点变化的函数
    handleNodesChange,
    // 处理边缘变化的函数
    handleEdgeChange,
    // 连接开始事件处理函数
    onConnectStart,
    // 连接结束事件处理函数
    onConnectEnd,
    // 自定义连接处理函数
    customOnConnect,
    // 鼠标进入边缘事件处理函数
    onEdgeMouseEnter,
    // 鼠标离开边缘事件处理函数
    onEdgeMouseLeave,
    // 水平辅助线数据
    helperLineHorizontal,
    // 垂直辅助线数据
    helperLineVertical,
    // 节点拖拽停止事件处理函数
    onNodeDragStop,
    // 画布右键菜单事件处理函数
    onPaneContextMenu,
    // 画布点击事件处理函数
    onPaneClick
  } = useWorkflow();

  // 使用Chakra UI的useDisclosure钩子管理模板模态框的开关状态
  const {
    // 模板是否打开
    isOpen: isOpenTemplate,
    // 打开模板的函数
    onOpen: onOpenTemplate,
    // 关闭模板的函数
    onClose: onCloseTemplate
  } = useDisclosure();

  return (
    <>
      <Box
        // 设置弹性布局，占用所有可用空间
        flex={'1 0 0'}
        // 设置高度为0，让内容决定实际高度
        h={0}
        // 设置宽度为100%
        w={'100%'}
        // 设置相对定位，作为ReactFlow的容器
        position={'relative'}
        // 阻止默认的右键菜单行为
        onContextMenu={(e) => {
          e.preventDefault();
          return false;
        }}
      >
        {/* 打开模块模板的按钮 */}
        <>
          <IconButton
            // 设置绝对定位
            position={'absolute'}
            // 距离顶部5个单位
            top={5}
            // 距离左侧5个单位
            left={5}
            // 设置按钮大小
            size={'mdSquare'}
            // 设置圆形边框
            borderRadius={'50%'}
            // 设置按钮图标
            icon={<SmallCloseIcon fontSize={'26px'} />}
            // 根据模板是否打开设置旋转变换
            transform={isOpenTemplate ? '' : 'rotate(135deg)'}
            // 设置过渡动画
            transition={'0.2s ease'}
            // 设置无障碍标签
            aria-label={''}
            // 设置z轴层级
            zIndex={1}
            // 设置阴影效果
            boxShadow={'2px 2px 6px #85b1ff'}
            // 设置点击事件处理函数
            onClick={() => {
              // 根据当前状态切换模板的开关
              isOpenTemplate ? onCloseTemplate() : onOpenTemplate();
            }}
          />
          {/* 节点模板模态框组件 */}
          <NodeTemplatesModal isOpen={isOpenTemplate} onClose={onCloseTemplate} />
        </>

        {/* ReactFlow主组件 */}
        <ReactFlow
          // 设置引用，用于获取ReactFlow实例
          ref={reactFlowWrapper}
          // 自动适应视图，使所有节点可见
          fitView
          // 传入节点数据
          nodes={nodes}
          // 传入边缘数据
          edges={edges}
          // 设置最小缩放级别
          minZoom={minZoom}
          // 设置最大缩放级别
          maxZoom={maxZoom}
          // 设置默认边缘选项
          defaultEdgeOptions={defaultEdgeOptions}
          // 选中边缘时提升其层级
          elevateEdgesOnSelect
          // 设置连接线样式
          connectionLineStyle={connectionLineStyle}
          // 设置节点类型映射
          nodeTypes={nodeTypes}
          // 设置边缘类型映射
          edgeTypes={edgeTypes}
          // 设置连接半径
          connectionRadius={50}
          // 设置节点变化事件处理函数
          onNodesChange={handleNodesChange}
          // 设置边缘变化事件处理函数
          onEdgesChange={handleEdgeChange}
          // 设置连接事件处理函数
          onConnect={customOnConnect}
          // 设置连接开始事件处理函数
          onConnectStart={onConnectStart}
          // 设置连接结束事件处理函数
          onConnectEnd={onConnectEnd}
          // 设置鼠标进入边缘事件处理函数
          onEdgeMouseEnter={onEdgeMouseEnter}
          // 设置鼠标离开边缘事件处理函数
          onEdgeMouseLeave={onEdgeMouseLeave}
          // 设置滚动速度
          panOnScrollSpeed={2}
          // 设置画布右键菜单事件处理函数
          onPaneContextMenu={onPaneContextMenu}
          // 设置画布点击事件处理函数
          onPaneClick={onPaneClick}
          // 根据工作流控制模式设置不同的选择和拖拽行为
          {...(workflowControlMode === 'select'
            ? {
                // 设置选择模式为完全选择
                selectionMode: SelectionMode.Full,
                // 禁止在拖拽节点时选择节点
                selectNodesOnDrag: false,
                // 启用拖拽选择
                selectionOnDrag: true,
                // 禁用选择键码
                selectionKeyCode: null,
                // 禁用拖拽平移
                panOnDrag: false,
                // 启用滚动平移
                panOnScroll: true
              }
            : {})}
          // 设置节点拖拽停止事件处理函数
          onNodeDragStop={onNodeDragStop}
        >
          {/* 上下文菜单组件 */}
          <ContextMenu />
          {/* 流程控制器组件 */}
          <FlowController />
          {/* 辅助线组件，用于对齐节点 */}
          <HelperLines horizontal={helperLineHorizontal} vertical={helperLineVertical} />
        </ReactFlow>
      </Box>
    </>
  );
};

// 使用React.memo优化组件，避免不必要的重新渲染
export default React.memo(Workflow);
