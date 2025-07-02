import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';

import { volcEngineApiRequest } from '../GenericFunctions';
import { imageResource, imageOperation, copyImageFields, describeTasksFields } from './ImageDescription';
import type { ICopyImageRequest, ICopyImageResponse, IDescribeTasksRequest, IDescribeTasksResponse } from '../types';

export class VolcEngineEcs implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'VolcEngine ECS',
		name: 'volcEngineEcs',
		icon: 'file:ecs.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with VolcEngine Elastic Compute Service (ECS)',
		defaults: {
			name: 'VolcEngine ECS',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'volcEngineApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: 'https://open.volcengineapi.com',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		},
		properties: [
			imageResource,
			imageOperation,
			...copyImageFields,
			...describeTasksFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				let responseData: any;

				if (resource === 'image') {
					if (operation === 'copy') {
						// 获取参数
						const imageId = this.getNodeParameter('imageId', i) as string;
						const destinationRegion = this.getNodeParameter('destinationRegion', i) as string;
						const imageName = this.getNodeParameter('imageName', i) as string;
						const description = this.getNodeParameter('description', i, '') as string;
						const copyImageTags = this.getNodeParameter('copyImageTags', i, false) as boolean;
						const projectName = this.getNodeParameter('projectName', i, '') as string;

						// 构建请求参数
						const requestBody: Partial<ICopyImageRequest> = {
							ImageId: imageId,
							DestinationRegion: destinationRegion as any,
							ImageName: imageName,
						};

						// 添加可选参数
						if (description) {
							requestBody.Description = description;
						}
						if (copyImageTags) {
							requestBody.CopyImageTags = copyImageTags;
						}
						if (projectName) {
							requestBody.ProjectName = projectName;
						}

						// 调用API
						responseData = await volcEngineApiRequest.call(
							this,
							'ecs',
							'POST',
							'CopyImage',
							requestBody,
						) as ICopyImageResponse;

						// 格式化返回数据
						const result = {
							success: true,
							requestId: responseData.ResponseMetadata.RequestId,
							sourceImageId: imageId,
							targetImageId: responseData.Result.ImageId,
							targetRegion: destinationRegion,
							targetImageName: imageName,
							message: `镜像复制成功，目标镜像ID: ${responseData.Result.ImageId}`,
						};

						returnData.push({
							json: result,
							pairedItem: { item: i },
						});
					} else if (operation === 'describeTasks') {
						// 获取参数
						const queryType = this.getNodeParameter('queryType', i) as string;
						const maxResults = this.getNodeParameter('maxResults', i, 20) as number;
						const nextToken = this.getNodeParameter('nextToken', i, '') as string;

						// 构建请求参数
						const requestBody: Partial<IDescribeTasksRequest> = {
							MaxResults: maxResults,
						};

						// 添加分页token
						if (nextToken) {
							requestBody.NextToken = nextToken;
						}

						// 根据查询类型添加相应参数
						if (queryType === 'taskIds') {
							const taskIdsStr = this.getNodeParameter('taskIds', i) as string;
							const taskIds = taskIdsStr.split(',').map(id => id.trim()).filter(id => id);
							if (taskIds.length === 0) {
								throw new Error('At least one task ID is required');
							}
							if (taskIds.length > 100) {
								throw new Error('Maximum 100 task IDs are allowed');
							}
							requestBody.TaskIds = taskIds;
						} else if (queryType === 'resourceIds') {
							const resourceIdsStr = this.getNodeParameter('resourceIds', i) as string;
							const resourceIds = resourceIdsStr.split(',').map(id => id.trim()).filter(id => id);
							if (resourceIds.length === 0) {
								throw new Error('At least one resource ID is required');
							}
							if (resourceIds.length > 100) {
								throw new Error('Maximum 100 resource IDs are allowed');
							}
							requestBody.ResourceIds = resourceIds;
						}

						// 调用API
						responseData = await volcEngineApiRequest.call(
							this,
							'ecs',
							'POST',
							'DescribeTasks',
							requestBody,
						) as IDescribeTasksResponse;

						// 格式化返回数据
						const result = {
							success: true,
							requestId: responseData.ResponseMetadata.RequestId,
							nextToken: responseData.Result.NextToken,
							tasks: responseData.Result.Tasks.map((task: any) => ({
								id: task.Id,
								createdAt: task.CreatedAt,
								updatedAt: task.UpdatedAt,
								endAt: task.EndAt,
								resourceId: task.ResourceId,
								type: task.Type,
								progress: task.Process,
								status: task.Status,
							})),
							totalTasks: responseData.Result.Tasks.length,
							hasMore: !!responseData.Result.NextToken,
						};

						returnData.push({
							json: result,
							pairedItem: { item: i },
						});
					}
				}
			} catch (error) {
				// 错误处理
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							success: false,
							error: error instanceof Error ? error.message : String(error),
							requestId: null,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
