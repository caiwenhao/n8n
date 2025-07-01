import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

import { volcEngineRegions } from '../nodes/VolcEngine/types';

export class VolcEngineApi implements ICredentialType {
	name = 'volcEngineApi';

	displayName = '火山云 API';

	documentationUrl = 'https://www.volcengine.com/docs/6291/65568';

	icon: Icon = 'file:volcengine.svg';

	httpRequestNode = {
		name: 'VolcEngine',
		docsUrl: 'https://www.volcengine.com/docs/6291/65568',
		apiBaseUrl: 'https://open.volcengineapi.com',
	};

	properties: INodeProperties[] = [
		{
			displayName: 'Access Key ID',
			name: 'accessKeyId',
			type: 'string',
			required: true,
			default: '',
			description: '火山云访问密钥ID，可在火山云控制台的访问控制页面获取',
		},
		{
			displayName: 'Secret Access Key',
			name: 'secretAccessKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			required: true,
			default: '',
			description: '火山云私有访问密钥，可在火山云控制台的访问控制页面获取',
		},
		{
			displayName: 'Region',
			name: 'region',
			type: 'options',
			options: volcEngineRegions,
			default: 'cn-beijing',
			description: '火山云服务地域',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'User-Agent': 'n8n-volcengine-node/1.0',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://open.volcengineapi.com',
			url: '/',
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				Action: 'DescribeRegions',
				Version: '2020-04-01',
			}).toString(),
		},
	};
}
