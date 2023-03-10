import { Customer, RetryConfig } from "../types";

import { IRequest } from 'itty-router'
import { Env } from "../types";
import { corsHeaders, RETRY_CONFIG } from "../utils/constant";
import { getCustomerSpecs, getRetryConfig } from "../helper";

const getRetryconfigCallback = async (request: IRequest, env: Env) => {
    const { customerId, endpointId } = request.params;

    const res = await getRetryConfig(env, customerId, endpointId);

    if (res.error) {
        return Response.json({
            error: res.error,
            errorCode: res.code,
            message: res.message
        }, {
            status: 400,
            headers: { ...corsHeaders }
        })
    }

    return Response.json({
        retryConfig: res.retryConfig
    }, {
        headers: { ...corsHeaders }
    })
}

const saveRetryConfigCallback = async (request: IRequest, env: Env) => {
    const { customerId, endpointId } = request.params;

    const body: { retryConfig: RetryConfig } = await request.json();

    if(!Object.keys(body).includes("retryConfig")) {
        return Response.json(
            { error: true, message: "Invalid retry config" },
            { 
                status: 400,
                headers: { ...corsHeaders } 
            }
        );
    }

    if (!body?.retryConfig?.numberOfRetries || !body?.retryConfig?.retryInterval || !body?.retryConfig?.timeout) {
        return Response.json(
            { error: true, message: "Invalid retry config" },
            { headers: { ...corsHeaders } }
        );
    }

    const res = await getCustomerSpecs(env, customerId);

    if (res.error || !res.customer) {
        return Response.json({
            error: res.error,
            errorCode: res.code,
            message: res.message
        }, {
            status: 400,
            headers: { ...corsHeaders }
        })
    }

    const existingCustomer: Customer = res.customer
    const existingEndpoints = existingCustomer && existingCustomer.endpoints.length;

    if(!existingEndpoints) {
        return Response.json({
            error: true,
            errorCode: 1003,
            message: "No endpoints exists for this customer"
        }, {
            status: 400,
            headers: { ...corsHeaders }
        });
    }

    const existingEndpoint = existingCustomer.endpoints.find(data => data.endpointId === endpointId);

    if (!existingEndpoint) {
        return Response.json({
            error: true,
            code: 1002,
            message: "Endpoint not found",
        }, {
            status: 400,
            headers: { ...corsHeaders }
        })
    }
    const updatedEndpointRetryConfig = existingCustomer.endpoints.map(item => {
        if (item.endpointId === endpointId) {
            item.retryConfig = body.retryConfig
            return item
        } else {
            return item
        }
    });

    existingCustomer.endpoints = updatedEndpointRetryConfig;

    await env.Customers.put(customerId, JSON.stringify(existingCustomer));

    return Response.json({ message: "Retry config updated successfully", data: existingCustomer }, {
        status: 200,
        headers: { ...corsHeaders }
    });
}

export {
    getRetryconfigCallback,
    saveRetryConfigCallback
}