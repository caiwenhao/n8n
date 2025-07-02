import type { INodeProperties } from 'n8n-workflow';
import { volcEngineRegions } from '../types';

// Image操作配置
export const imageOperation: INodeProperties = {
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
			description: 'Copy an image across regions',
		},
		{
			name: 'Describe Tasks',
			value: 'describeTasks',
			action: 'Query task progress',
			description: 'Query the progress of asynchronous tasks',
		},
	],
	default: 'copy',
};

// CopyImage操作字段配置
export const copyImageFields: INodeProperties[] = [
	{
		displayName: 'Source Image ID',
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
		description: 'Source custom image ID to copy, format: image-xxxxxxxxxxxxxx',
	},
	{
		displayName: 'Destination Region',
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
		description: 'Target region for the image, cannot be the same as source region',
	},
	{
		displayName: 'Target Image Name',
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
		description: 'Target custom image name, length limit: 1-128 characters',

	},
	{
		displayName: 'Image Description',
		name: 'description',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['image'],
				operation: ['copy'],
			},
		},
		default: '',
		placeholder: 'Copied image description',
		description: 'Target image description, defaults to source image description if empty, length limit: 0-255 characters',

	},
	{
		displayName: 'Copy Image Tags',
		name: 'copyImageTags',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['image'],
				operation: ['copy'],
			},
		},
		default: false,
		description: 'Whether to copy source image tags to target image',
	},
	{
		displayName: 'Project Name',
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
		description: 'Project name for the image, required if account has limited project permissions',
	},
];
// DescribeTasks操作字段配置
export const describeTasksFields: INodeProperties[] = [
	{
		displayName: 'Query Type',
		name: 'queryType',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['image'],
				operation: ['describeTasks'],
			},
		},
		options: [
			{
				name: 'By Task IDs',
				value: 'taskIds',
				description: 'Query tasks by task IDs',
			},
			{
				name: 'By Resource IDs',
				value: 'resourceIds',
				description: 'Query tasks by resource IDs',
			},
		],
		default: 'taskIds',
		description: 'Choose how to query tasks',
	},
	{
		displayName: 'Task IDs',
		name: 'taskIds',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['image'],
				operation: ['describeTasks'],
				queryType: ['taskIds'],
			},
		},
		default: '',
		placeholder: 't-ybnz9qci2sahiqdl1234, t-ybnz9qci2sahiqdl5678',
		description: 'Comma-separated task IDs (maximum 100). You can get task IDs from CopyImage, ExportImage operations.',
	},
	{
		displayName: 'Resource IDs',
		name: 'resourceIds',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['image'],
				operation: ['describeTasks'],
				queryType: ['resourceIds'],
			},
		},
		default: '',
		placeholder: 'image-ebgy1og99tfct0gw1234, image-ebgy1og99tfct0gw5678',
		description: 'Comma-separated resource IDs (maximum 100). Usually image IDs.',
	},
	{
		displayName: 'Max Results',
		name: 'maxResults',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['image'],
				operation: ['describeTasks'],
			},
		},
		default: 20,
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		description: 'Maximum number of results per page (1-100, default: 20)',
	},
	{
		displayName: 'Next Token',
		name: 'nextToken',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['image'],
				operation: ['describeTasks'],
			},
		},
		default: '',
		placeholder: '3tiegs1y963vj0******',
		description: 'Pagination token for retrieving the next page of results',
	},
];

// Image resource configuration
export const imageResource: INodeProperties = {
	displayName: 'Resource',
	name: 'resource',
	type: 'options',
	noDataExpression: true,
	options: [
		{
			name: 'Image',
			value: 'image',
			description: 'Image management',
		},
	],
	default: 'image',
};
