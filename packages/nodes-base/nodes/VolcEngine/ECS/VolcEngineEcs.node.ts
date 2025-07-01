import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { volcEngineApiRequest } from '../GenericFunctions';
import { imageResource, copyImageOperation, copyImageFields } from './ImageDescription';
import type { ICopyImageRequest, ICopyImageResponse } from '../types';

export class VolcEngineEcs implements INodeType {
	description: INodeTypeDescription = {
		displayName: '火山云 ECS',
		name: 'volcEngineEcs',
		icon: 'file:ecs.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: '火山云弹性计算服务（ECS）操作',
		defaults: {
			name: '火山云 ECS',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
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
			copyImageOperation,
			...copyImageFields,
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
					}
				}
			} catch (error) {
				// 错误处理
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							success: false,
							error: error.message,
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
