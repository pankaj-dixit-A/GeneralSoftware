from sqlalchemy import text,func
from app import app, db
import asyncio
import aiohttp
import os
from flask import Flask, jsonify, request
from app.models.BusinessReleted.DeliveryOrder.DeliveryOrderModels import DeliveryOrderHead,DeliveryOrderDetail
from app.models.BusinessReleted.TenderPurchase.TenderPurchaseModels import TenderHead,TenderDetails
from app.utils.CommonGLedgerFunctions import get_accoid,fetch_company_parameters

API_URL_SERVER = os.getenv('API_URL_SERVER')

#Asynchronous API Posting 
async def async_post(url, params=None, json=None):
    async with aiohttp.ClientSession() as session:
        async with session.post(url, params=params, json=json) as response:
            return await response.json(), response.status

async def async_put(url, params=None, json=None):
    async with aiohttp.ClientSession() as session:
        async with session.put(url, params=params, json=json) as response:
            return await response.json(), response.status
        
async def async_delete(url, params=None, json=None):
    async with aiohttp.ClientSession() as session:
        async with session.delete(url, params=params, json=json) as response:
            return await response.json(), response.status

#GET Max Doc No       
def get_max_doc_no():
        return db.session.query(func.max(DeliveryOrderHead.doc_no)).scalar() or 0

#Remove the feilds from the Delivey Order Function
def remove_columns_from_data(data, columns_to_remove=None):
    if columns_to_remove is None:
        columns_to_remove = [
            'TaxableAmountForSB', 'cgstrate', 'sgstrate', 'igstrate', 'cgstamt',
            'sgstamt', 'igstamt', 'SaleDetail_Rate', 'SB_freight', 'SB_SubTotal', 'SB_Less_Frt_Rate',
            'TotalGstSaleBillAmount', 'Roundoff', 'SBTCSAmt', 'Net_Payble', 'SBTDSAmt', 'save', 'sale',
            'item_Amount', 'SB_Ac_Code', 'SB_Unit_Code', 'PS_CGSTAmount', 'PS_SGSTAmount', 'PS_IGSTAmount', 'PS_CGSTRATE',
            'PS_SGSTRATE', 'PS_IGSTRATE', 'TOTALPurchase_Amount', 'PSTCS_Amt', 'PSTDS_Amt', 'PSNetPayble', 'PS_SelfBal', 'PS_amount', 'lblgetpasscodename',
            'lblvoucherByname', 'Gst_Rate', 'AutopurchaseBill', 'LV_CGSTAmount', 'LV_SGSTAmount', 'LV_IGSTAmount', 'LV_TotalAmount',
            'LV_TCSRate', 'LV_NETPayble', 'LV_TCSAmt', 'LV_TDSRate', 'LV_TDSAmt', 'LV_Igstrate', 'LV_Cgstrate', 'LV_taxableamount',
            'LV_Sgstrate', 'LV_Commision_Amt', 'LV_tender_Commision_Amt', 'gstratename', 'Gstrate', 'lblitemname',
            'newbroker', 'lblbrokername'
        ]
    
    for key in columns_to_remove:
        if key in data:
            del data[key]
    return data

#Genrate the Gldger Entries 
async def genrate_gledger_entries(headData, company_parameters, getpasscode, selfac, new_doc_no,add_gledger_entry,new_sale_data):
    gledger_entries = []
    ordercode = 0
    
    vasuli_amount1=float(headData['vasuli_amount1'])
    vasuli_amount=float(headData['vasuli_amount'])
    TDSAc = headData['TDSAc']
    TDSAmt = float(headData['TDSAmt'])
    TDSCut = headData['TDSCut']
    transport = headData['transport']
    Memo_Advance = float(headData['Memo_Advance'])
    MemoGstRate =float(headData['MemoGSTRate'])

    if TDSCut =='N' :
        transporttdsac=transport
    else:
        transporttdsac=company_parameters.TransportTDS_AcCut
        
    gledger_entries = []
    if getpasscode != selfac :
        if vasuli_amount1 != 0:
            ordercode = ordercode+1
            GETPASSCODE = headData['GETPASSCODE']
            accoid = get_accoid(GETPASSCODE,headData['company_code'])
            add_gledger_entry(gledger_entries, headData, vasuli_amount1, 'D', GETPASSCODE, accoid,0,ordercode,'vasuli_amount1')

            ordercode = ordercode+1
            Vasuli_Ac = headData['Vasuli_Ac']
            accoid = get_accoid(Vasuli_Ac,headData['company_code'])
            add_gledger_entry(gledger_entries, headData, vasuli_amount1, 'D', Vasuli_Ac, accoid,9999971,ordercode,'vasuli_amount1')
            
        if TDSAc != 0 :      
            if TDSAmt != 0 :
                ordercode = ordercode+1
                accoid = get_accoid(TDSAc,headData['company_code'])
                add_gledger_entry(gledger_entries, headData, TDSAmt, 'C', TDSAc, accoid,9999971,ordercode,'TDSAmt')

                ordercode = ordercode+1
                accoid = get_accoid(transporttdsac,headData['company_code'])
                add_gledger_entry(gledger_entries, headData, TDSAmt, 'D', transporttdsac, accoid,transporttdsac,ordercode,'TDSAmt')
                
        if Memo_Advance != 0 :
            ordercode = ordercode+1
            accoid = get_accoid(transport,headData['company_code'])
            add_gledger_entry(gledger_entries, headData, Memo_Advance, "C", transport, accoid,transport,ordercode,'Memo_Advance')
            
                
            ordercode=ordercode+1
            Freight_Ac=company_parameters.Freight_Ac
            accoid = get_accoid(Freight_Ac,headData['company_code'])
            add_gledger_entry(gledger_entries, headData, Memo_Advance, "D", Freight_Ac, accoid,Freight_Ac,ordercode,'Memo_Advance')
            
            if MemoGstRate != 0:
                RCMCGST=float(new_sale_data.get('RCMCGSTAmt', 0) or 0)
                RCMSGST=float(new_sale_data.get('RCMSGSTAmt', 0) or 0)
                RCMIGST=float(new_sale_data.get('RCMIGSTAmt', 0) or 0)
               

                if RCMCGST > 0:
                    ordercode=ordercode+1
                    CGST_RCM_Ac=company_parameters.CGST_RCM_Ac
                    accoid = get_accoid(CGST_RCM_Ac,headData['company_code'])
                    add_gledger_entry(gledger_entries, headData, RCMCGST, "D", CGST_RCM_Ac, accoid,headData['transport'],ordercode,'RCMCGST')
                    
                    ordercode=ordercode+1
                    CCGSTAc=company_parameters.CGSTAc
                    accoid = get_accoid(CCGSTAc,headData['company_code'])
                    add_gledger_entry(gledger_entries, headData, RCMCGST, "C", CCGSTAc, accoid, headData['transport'],ordercode,'RCMCGST')
                    
                if RCMSGST > 0:
                    ordercode=ordercode+1
                    SGST_RCM_Ac=company_parameters.SGST_RCM_Ac
                    accoid = get_accoid(SGST_RCM_Ac,headData['company_code'])
                    add_gledger_entry(gledger_entries, headData, RCMSGST, "D", SGST_RCM_Ac, accoid,headData['transport'],ordercode,'RCMSGST')
                    
                    ordercode=ordercode+1
                    SGSTAc=company_parameters.SGSTAc
                    accoid = get_accoid(SGSTAc,headData['company_code'])
                    add_gledger_entry(gledger_entries, headData, RCMSGST, "C",SGSTAc, accoid, headData['transport'],ordercode,'RCMSGST')
                
                if RCMIGST > 0:
                    ordercode=ordercode+1
                    IGST_RCM_Ac=company_parameters.IGST_RCM_Ac
                    accoid = get_accoid(IGST_RCM_Ac,headData['company_code'])
                    add_gledger_entry(gledger_entries, headData, RCMIGST, "D", IGST_RCM_Ac, accoid,headData['transport'],ordercode,'RCMIGST')
                    
                    ordercode=ordercode+1
                    IGSTAc=company_parameters.IGSTAc
                    accoid = get_accoid(IGSTAc,headData['company_code'])
                    add_gledger_entry(gledger_entries, headData, RCMIGST, "C", IGSTAc, accoid, headData['transport'],ordercode,'RCMIGST')
        
        if vasuli_amount != 0:
            ordercode=ordercode+1
            accoid = get_accoid(transport,headData['company_code'])
            add_gledger_entry(gledger_entries, headData, vasuli_amount, 'D', transport, accoid,transport,ordercode,'vasuli_amount')

            ordercode=ordercode+1
            accoid = get_accoid(1,headData['company_code'])
            add_gledger_entry(gledger_entries, headData, vasuli_amount, 'C', transport, accoid,transport,ordercode,'vasuli_amount')
        
    else:
        if TDSAc != 0 :      
            if TDSAmt != 0 :
                ordercode=ordercode+1
                accoid = get_accoid(TDSAc,headData['company_code'])
                add_gledger_entry(gledger_entries, headData, TDSAmt, 'C', TDSAc, accoid,9999971,ordercode,"")

                ordercode=ordercode+1
                accoid = get_accoid(transporttdsac,headData['company_code'])
                add_gledger_entry(gledger_entries, headData, TDSAmt, 'D', transporttdsac, accoid,transporttdsac,ordercode,"")
            
        if vasuli_amount != 0:
            ordercode=ordercode+1
            accoid = get_accoid(transport,headData['company_code'])
            add_gledger_entry(gledger_entries, headData, vasuli_amount, 'D', transport, accoid,transport,ordercode,"")

            ordercode=ordercode+1
            accoid = get_accoid(1,headData['company_code'])
            add_gledger_entry(gledger_entries, headData, vasuli_amount, 'C', 1, accoid,transport,ordercode,"")
            
        if Memo_Advance != 0 :
                ordercode=ordercode+1
                accoid = get_accoid(transport,headData['company_code'])
                add_gledger_entry(gledger_entries, headData, Memo_Advance, "C", transport, accoid,transport,ordercode,"")
                
                
                ordercode=ordercode+1
                Freight_Ac=company_parameters.Freight_Ac
                accoid = get_accoid(Freight_Ac,headData['company_code'])
                add_gledger_entry(gledger_entries, headData, Memo_Advance, "D", Freight_Ac, accoid,Freight_Ac,ordercode,"")
                
                if MemoGstRate != 0:
                    RCMCGST=float(new_sale_data.get('RCMCGSTAmt', 0) or 0)
                    RCMSGST=float(new_sale_data.get('RCMSGSTAmt', 0) or 0)
                    RCMIGST=float(new_sale_data.get('RCMIGSTAmt', 0) or 0)
                  

                    if RCMCGST > 0:
                        ordercode=ordercode+1
                        CGST_RCM_Ac=company_parameters.CGST_RCM_Ac
                        accoid = get_accoid(CGST_RCM_Ac,headData['company_code'])
                        add_gledger_entry(gledger_entries, headData, RCMCGST, "D", CGST_RCM_Ac, accoid,headData['transport'],ordercode,"")
                        
                        ordercode=ordercode+1
                        CCGSTAc=company_parameters.CGSTAc
                        accoid = get_accoid(CCGSTAc,headData['company_code'])
                        add_gledger_entry(gledger_entries, headData, RCMCGST, "C", CCGSTAc, accoid,headData['transport'],ordercode,"")
                        
                    if RCMSGST > 0:
                        ordercode=ordercode+1
                        SGST_RCM_Ac=company_parameters.SGST_RCM_Ac
                        accoid = get_accoid(SGST_RCM_Ac,headData['company_code'])
                        add_gledger_entry(gledger_entries, headData, RCMSGST, "D", SGST_RCM_Ac, accoid,headData['transport'],ordercode,"")
                    
                        ordercode=ordercode+1
                        SGSTAc=company_parameters.SGSTAc
                        accoid = get_accoid(SGSTAc,headData['company_code'])
                        add_gledger_entry(gledger_entries, headData, RCMSGST, "C", SGSTAc, accoid, headData['transport'],ordercode,"")
                        
                    if RCMIGST > 0:
                        ordercode=ordercode+1
                        IGST_RCM_Ac=company_parameters.IGST_RCM_Ac
                        accoid = get_accoid(IGST_RCM_Ac,headData['company_code'])
                        add_gledger_entry(gledger_entries, headData, RCMIGST, "D", IGST_RCM_Ac, accoid,headData['transport'],ordercode,"")
                        
                        ordercode=ordercode+1
                        IGSTAc=company_parameters.IGSTAc
                        accoid = get_accoid(IGSTAc,headData['company_code'])
                        add_gledger_entry(gledger_entries, headData, RCMIGST, "C", IGSTAc, accoid,headData['transport'],ordercode,"")
        
    return gledger_entries

