import type { IDataObject } from 'n8n-workflow';

// VolcEngine region enumeration
export enum VolcEngineRegion {
	CN_BEIJING = 'cn-beijing',
	CN_SHANGHAI = 'cn-shanghai',
	CN_GUANGZHOU = 'cn-guangzhou',
	CN_CHENGDU = 'cn-chengdu',
	CN_HANGZHOU = 'cn-hangzhou',
	CN_NANJING = 'cn-nanjing',
	AP_SINGAPORE = 'ap-singapore',
	AP_TOKYO = 'ap-tokyo',
	US_EAST_1 = 'us-east-1',
	US_WEST_2 = 'us-west-2',
}

// VolcEngine region options (for UI display)
export const volcEngineRegions = [
	{
		name: '华北2（北京）- cn-beijing',
		value: VolcEngineRegion.CN_BEIJING,
	},
	{
		name: '华东2（上海）- cn-shanghai',
		value: VolcEngineRegion.CN_SHANGHAI,
	},
	{
		name: '华南1（广州）- cn-guangzhou',
		value: VolcEngineRegion.CN_GUANGZHOU,
	},
	{
		name: '西南1（成都）- cn-chengdu',
		value: VolcEngineRegion.CN_CHENGDU,
	},
	{
		name: '华东1（杭州）- cn-hangzhou',
		value: VolcEngineRegion.CN_HANGZHOU,
	},
	{
		name: '华东3（南京）- cn-nanjing',
		value: VolcEngineRegion.CN_NANJING,
	},
	{
		name: '亚太东南1（新加坡）- ap-singapore',
		value: VolcEngineRegion.AP_SINGAPORE,
	},
	{
		name: '亚太东北1（东京）- ap-tokyo',
		value: VolcEngineRegion.AP_TOKYO,
	},
	{
		name: 'US East 1 (Virginia) - us-east-1',
		value: VolcEngineRegion.US_EAST_1,
	},
	{
		name: 'US West 2 (Oregon) - us-west-2',
		value: VolcEngineRegion.US_WEST_2,
	},
];

// VolcEngine credentials interface
export interface IVolcEngineCredentials {
	accessKeyId: string;
	secretAccessKey: string;
	region: VolcEngineRegion;
}

// CopyImage请求接口
export interface ICopyImageRequest {
	Action: 'CopyImage';
	Version: '2020-04-01';
	ImageId: string;
	DestinationRegion: VolcEngineRegion;
	ImageName: string;
	Description?: string;
	CopyImageTags?: boolean;
	ProjectName?: string;
}

// CopyImage响应接口
export interface ICopyImageResponse {
	ResponseMetadata: {
		RequestId: string;
		Action: string;
		Version: string;
		Service: string;
		Region: string;
	};
	Result: {
		ImageId: string;
	};
}

// DescribeTasks请求接口
export interface IDescribeTasksRequest {
	Action: 'DescribeTasks';
	Version: '2020-04-01';
	MaxResults?: number;
	NextToken?: string;
	ResourceId?: string;
	ResourceIds?: string[];
	TaskIds?: string[];
}

// DescribeTasks响应接口
export interface IDescribeTasksResponse {
	ResponseMetadata: {
		RequestId: string;
		Action: string;
		Version: string;
		Service: string;
		Region: string;
	};
	Result: {
		NextToken: string;
		Tasks: ITaskInfo[];
	};
}

// 任务信息接口
export interface ITaskInfo {
	Id: string;
	CreatedAt: string;
	UpdatedAt: string;
	EndAt: string;
	ResourceId: string;
	Type: string;
	Process: number;
	Status: string;
}

// VolcEngine API error response interface
export interface IVolcEngineErrorResponse {
	ResponseMetadata: {
		RequestId: string;
		Action: string;
		Version: string;
		Service: string;
		Region: string;
		Error: {
			Code: string;
			Message: string;
		};
	};
}

// VolcEngine error code enumeration
export enum VolcEngineErrorCode {
	INVALID_ARGUMENT = 'InvalidArgument',
	INVALID_DESCRIPTION_MALFORMED = 'InvalidDescription.Malformed',
	INVALID_DESTINATION_REGION_MALFORMED = 'InvalidDestinationRegion.Malformed',
	INVALID_IMAGE_FOR_COPY_IMAGE_UNSUPPORTED = 'InvalidImageForCopyImage.UnSupported',
	INVALID_IMAGE_NAME_MALFORMED = 'InvalidImageName.Malformed',
	INVALID_REGION_FOR_COPY_IMAGE_UNSUPPORTED = 'InvalidRegionForCopyImage.UnSupported',
	LIMIT_EXCEEDED_MAXIMUM_IMAGE_COUNT = 'LimitExceeded.MaximumImageCount',
	LIMIT_EXCEEDED_MAXIMUM_IMAGE_SIZE = 'LimitExceeded.MaximumImageSize',
	MISSING_PARAMETER_DESTINATION_REGION = 'MissingParameter.DestinationRegion',
	MISSING_PARAMETER_IMAGE_ID = 'MissingParameter.ImageId',
	MISSING_PARAMETER_IMAGE_NAME = 'MissingParameter.ImageName',
	INVALID_ACTION_OR_VERSION = 'InvalidActionOrVersion',
	INVALID_IMAGE_NOT_FOUND = 'InvalidImage.NotFound',
	INVALID_PROJECT_NOT_FOUND = 'InvalidProject.NotFound',
	INVALID_DESTINATION_REGION_MISMATCH = 'InvalidDestinationRegion.Mismatch',
	OPERATION_DENIED_RESOURCE_LOCKED = 'OperationDenied.ResourceLocked',
	OPERATION_DENIED_SNAPSHOT_SERVICE_UNAVAILABLE = 'OperationDenied.SnapshotServiceUnavailable',
	INTERNAL_ERROR = 'InternalError',
}

// VolcEngine API common response interface
export interface IVolcEngineApiResponse extends IDataObject {
	ResponseMetadata: {
		RequestId: string;
		Action: string;
		Version: string;
		Service: string;
		Region: string;
		Error?: {
			Code: string;
			Message: string;
		};
	};
	Result?: IDataObject;
}

// VolcEngine API request parameters interface
export interface IVolcEngineApiRequest extends IDataObject {
	Action: string;
	Version: string;
	[key: string]: any;
}

// 签名相关接口
export interface IVolcEngineSignatureOptions {
	accessKeyId: string;
	secretAccessKey: string;
	region: string;
	service: string;
	method: string;
	url: string;
	headers: IDataObject;
	body?: string;
	timestamp: string;
}

// VolcEngine service enumeration
export enum VolcEngineService {
	ECS = 'ecs',
	RDS = 'rds',
	CDN = 'cdn',
	VPC = 'vpc',
	CLB = 'clb',
	CFS = 'cfs',
}

// ECS资源类型枚举
export enum VolcEngineEcsResource {
	IMAGE = 'image',
	INSTANCE = 'instance',
	VOLUME = 'volume',
	SNAPSHOT = 'snapshot',
}

// ECS操作类型枚举
export enum VolcEngineEcsOperation {
	COPY = 'copy',
	CREATE = 'create',
	DELETE = 'delete',
	DESCRIBE = 'describe',
	MODIFY = 'modify',
}
