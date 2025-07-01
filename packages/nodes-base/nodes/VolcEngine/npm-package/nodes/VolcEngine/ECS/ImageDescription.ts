import type { INodeProperties } from 'n8n-workflow';
import { volcEngineRegions } from '../types';

// CopyImage操作配置
export const copyImageOperation: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['image'],
		},
	},
	options: [
		{
			name: 'Copy',
			value: 'copy',
			action: 'Copy an image across regions',
			description: '跨地域复制镜像',
		},
	],
	default: 'copy',
};

// CopyImage操作字段配置
export const copyImageFields: INodeProperties[] = [
	{
		displayName: '源镜像ID',
		name: 'imageId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['image'],
				operation: ['copy'],
			},
		},
		default: '',
		placeholder: 'image-xxxxxxxxxxxxxx',
		description: '要复制的源自定义镜像ID，格式如：image-xxxxxxxxxxxxxx',

	},
	{
		displayName: '目标地域',
		name: 'destinationRegion',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['image'],
				operation: ['copy'],
			},
		},
		options: volcEngineRegions,
		default: 'cn-shanghai',
		description: '目标镜像所在地域，不能与源镜像地域相同',
	},
	{
		displayName: '目标镜像名称',
		name: 'imageName',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['image'],
				operation: ['copy'],
			},
		},
		default: '',
		placeholder: 'my-copied-image',
		description: '目标自定义镜像名称，长度限制为1-128个字符',

	},
	{
		displayName: '镜像描述',
		name: 'description',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['image'],
				operation: ['copy'],
			},
		},
		default: '',
		placeholder: '复制的镜像描述',
		description: '目标镜像描述，不填默认与源自定义镜像一致，长度限制为0-255个字符',

	},
	{
		displayName: '复制镜像标签',
		name: 'copyImageTags',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['image'],
				operation: ['copy'],
			},
		},
		default: false,
		description: '是否复制源镜像标签到目标镜像',
	},
	{
		displayName: '项目名称',
		name: 'projectName',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['image'],
				operation: ['copy'],
			},
		},
		default: '',
		placeholder: 'default',
		description: '镜像所属项目，如果调用接口账号仅拥有部分项目权限，本参数必填',
	},
];

// 镜像资源配置
export const imageResource: INodeProperties = {
	displayName: 'Resource',
	name: 'resource',
	type: 'options',
	noDataExpression: true,
	options: [
		{
			name: 'Image',
			value: 'image',
			description: '镜像管理',
		},
	],
	default: 'image',
};
