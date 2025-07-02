import type {
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	IWebhookFunctions,
	IHttpRequestOptions,
	IHttpRequestMethods,
	IDataObject,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { createHash, createHmac } from 'crypto';

import type {
	IVolcEngineCredentials,
	IVolcEngineApiRequest,
	IVolcEngineApiResponse,
	IVolcEngineSignatureOptions,
} from './types';

/**
 * VolcEngine API request function
 */
export async function volcEngineApiRequest(
	this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions | IWebhookFunctions,
	service: string,
	method: IHttpRequestMethods,
	action: string,
	body?: IDataObject,
	query?: IDataObject,
	headers?: IDataObject,
): Promise<any> {
	const credentials = await this.getCredentials('volcEngineApi') as IVolcEngineCredentials;
	
	// 构建请求参数
	const requestBody: IVolcEngineApiRequest = {
		Action: action,
		Version: '2020-04-01',
		...body,
	};

	// 构建查询参数
	const queryParams = {
		...query,
	};

	const requestOptions: IHttpRequestOptions = {
		method,
		url: `https://open.volcengineapi.com`,
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			...headers,
		},
		body: new URLSearchParams(requestBody as any).toString(),
		qs: queryParams,
	};

	// 添加签名认证
	const signedOptions = await addVolcEngineSignature.call(
		this,
		requestOptions,
		credentials,
		service,
	);

	try {
		const response = await this.helpers.httpRequest(signedOptions);
		return parseVolcEngineResponse(response);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

/**
 * Add VolcEngine signature authentication
 */
async function addVolcEngineSignature(
	this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions | IWebhookFunctions,
	requestOptions: IHttpRequestOptions,
	credentials: IVolcEngineCredentials,
	service: string,
): Promise<IHttpRequestOptions> {
	const timestamp = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
	const date = timestamp.substr(0, 8);

	// 添加必要的头部
	const headers = {
		'Content-Type': 'application/x-www-form-urlencoded',
		'Host': 'open.volcengineapi.com',
		'X-Date': timestamp,
		...requestOptions.headers,
	};

	const signatureOptions: IVolcEngineSignatureOptions = {
		accessKeyId: credentials.accessKeyId,
		secretAccessKey: credentials.secretAccessKey,
		region: credentials.region,
		service,
		method: requestOptions.method!,
		url: requestOptions.url!,
		headers,
		body: requestOptions.body as string,
		timestamp,
	};

	// 创建规范请求
	const canonicalRequest = createCanonicalRequest(signatureOptions);

	// 创建待签名字符串
	const stringToSign = createStringToSign(canonicalRequest, timestamp, credentials.region, service);

	// 计算签名
	const signature = calculateSignature(stringToSign, credentials.secretAccessKey, date, credentials.region, service);

	// 添加Authorization头
	const authorizationHeader = `HMAC-SHA256 Credential=${credentials.accessKeyId}/${date}/${credentials.region}/${service}/request, SignedHeaders=content-type;host;x-date, Signature=${signature}`;

	requestOptions.headers = {
		...headers,
		'Authorization': authorizationHeader,
	};

	return requestOptions;
}

/**
 * 创建规范请求字符串
 */
function createCanonicalRequest(options: IVolcEngineSignatureOptions): string {
	const { method, url, headers, body } = options;
	
	// 解析URL
	const urlObj = new URL(url);
	const canonicalUri = urlObj.pathname || '/';
	const canonicalQueryString = urlObj.search.slice(1) || '';

	// 规范化头部
	const canonicalHeaders = Object.keys(headers)
		.map(key => key.toLowerCase())
		.sort()
		.map(key => `${key}:${headers[key]}\n`)
		.join('');

	const signedHeaders = Object.keys(headers)
		.map(key => key.toLowerCase())
		.sort()
		.join(';');

	// 计算请求体哈希
	const payloadHash = createHash('sha256').update(body || '').digest('hex');

	return [
		method,
		canonicalUri,
		canonicalQueryString,
		canonicalHeaders,
		signedHeaders,
		payloadHash,
	].join('\n');
}

/**
 * 创建待签名字符串
 */
function createStringToSign(
	canonicalRequest: string,
	timestamp: string,
	region: string,
	service: string,
): string {
	const algorithm = 'HMAC-SHA256';
	const date = timestamp.substr(0, 8);
	const credentialScope = `${date}/${region}/${service}/request`;
	const hashedCanonicalRequest = createHash('sha256').update(canonicalRequest).digest('hex');

	return [
		algorithm,
		timestamp,
		credentialScope,
		hashedCanonicalRequest,
	].join('\n');
}

/**
 * 计算签名
 */
function calculateSignature(
	stringToSign: string,
	secretAccessKey: string,
	date: string,
	region: string,
	service: string,
): string {
	const kDate = createHmac('sha256', `volc${secretAccessKey}`).update(date).digest();
	const kRegion = createHmac('sha256', kDate).update(region).digest();
	const kService = createHmac('sha256', kRegion).update(service).digest();
	const kSigning = createHmac('sha256', kService).update('request').digest();
	
	return createHmac('sha256', kSigning).update(stringToSign).digest('hex');
}

/**
 * Parse VolcEngine API response
 */
function parseVolcEngineResponse(response: any): IVolcEngineApiResponse {
	// 如果响应是字符串，尝试解析为JSON
	if (typeof response === 'string') {
		try {
			response = JSON.parse(response);
		} catch (error) {
			throw new Error(`Failed to parse response: ${response}`);
		}
	}

	// 检查是否有错误
	if (response.ResponseMetadata?.Error) {
		const error = response.ResponseMetadata.Error;
		throw new Error(`VolcEngine API Error: ${error.Code} - ${error.Message}`);
	}

	return response;
}

/**
 * Parse VolcEngine error response
 */
export function parseVolcEngineError(error: any): Error {
	if (error.response?.data?.ResponseMetadata?.Error) {
		const volcError = error.response.data.ResponseMetadata.Error;
		return new Error(`VolcEngine API Error: ${volcError.Code} - ${volcError.Message}`);
	}
	
	return error;
}
