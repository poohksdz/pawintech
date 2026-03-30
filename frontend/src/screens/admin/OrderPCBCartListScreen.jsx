import React, { useState } from 'react'
import { Table, Button, Form, Modal } from 'react-bootstrap'
import { FaCheck, FaTimes, FaEye, FaTrash } from 'react-icons/fa'
import { toast } from 'react-toastify'
import Message from '../../components/Message'
import Loader from '../../components/Loader'
import {
    useGetAllOrderPCBCartsQuery,
    useUpdateOrderpcbCartStatusMutation,
    useDeleteOrderpcbCartMutation
} from '../../slices/orderpcbCartApiSlice'

const OrderPCBCartListScreen = () => {
    const { data: carts, isLoading, error, refetch } = useGetAllOrderPCBCartsQuery()
    const [updateStatus, { isLoading: loadingUpdate }] = useUpdateOrderpcbCartStatusMutation()
    const [deleteCart, { isLoading: loadingDelete }] = useDeleteOrderpcbCartMutation()

    const [showModal, setShowModal] = useState(false)
    const [selectedCart, setSelectedCart] = useState(null)
    const [confirmedPrice, setConfirmedPrice] = useState('')
    const [remark, setRemark] = useState('')

    const handleShowModal = (cart) => {
        setSelectedCart(cart)
        setConfirmedPrice(cart.confirmed_price || '0')
        setRemark(cart.remark || '')
        setShowModal(true)
    }

    const handleUpdateStatus = async (status) => {
        try {
            await updateStatus({
                id: selectedCart.id,
                status,
                confirmed_price: confirmedPrice,
                remark
            }).unwrap()
            toast.success(`Order ${status} successfully`)
            setShowModal(false)
            refetch()
        } catch (err) {
            toast.error(err?.data?.message || err.error)
        }
    }

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this cart item?')) {
            try {
                await deleteCart(id).unwrap()
                toast.success('Cart item deleted')
                refetch()
            } catch (err) {
                toast.error(err?.data?.message || err.error)
            }
        }
    }

    return (
        <>
            <h1>Standard PCB Cart Requests (Approval-First)</h1>
            {isLoading ? (
                <Loader />
            ) : error ? (
                <Message variant='danger'>{error?.data?.message || error.error}</Message>
            ) : (
                <Table striped hover responsive className='table-sm'>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>USER ID</th>
                            <th>PROJECT</th>
                            <th>SPECS</th>
                            <th>STATUS</th>
                            <th>PRICE</th>
                            <th>DATE</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {carts.data.map((cart) => (
                            <tr key={cart.id}>
                                <td>{cart.id}</td>
                                <td>{cart.user_id}</td>
                                <td>{cart.projectname}</td>
                                <td>
                                    {cart.layers}L, {cart.pcb_qty}pcs, {cart.length_cm}x{cart.width_cm}mm
                                </td>
                                <td>
                                    <span className={`badge bg-${cart.status === 'accepted' ? 'success' : cart.status === 'pending' ? 'warning' : 'danger'}`}>
                                        {cart.status.toUpperCase()}
                                    </span>
                                </td>
                                <td>{cart.confirmed_price ? `฿${cart.confirmed_price}` : 'N/A'}</td>
                                <td>{new Date(cart.created_at).toLocaleDateString()}</td>
                                <td>
                                    <Button variant='light' className='btn-sm' onClick={() => handleShowModal(cart)}>
                                        <FaEye /> Review
                                    </Button>
                                    <Button variant='danger' className='btn-sm ms-2' onClick={() => handleDelete(cart.id)}>
                                        <FaTrash />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}

            <Modal show={showModal} onHide={() => setShowModal(false)} size='lg'>
                <Modal.Header closeButton>
                    <Modal.Title>Review Gerber PCB Request</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedCart && (
                        <div className='mb-4'>
                            <p><strong>Project:</strong> {selectedCart.projectname}</p>
                            <p><strong>Quantity:</strong> {selectedCart.pcb_qty} PCS</p>
                            <p><strong>Dimensions:</strong> {selectedCart.length_cm} x {selectedCart.width_cm} mm</p>
                            <p><strong>Layers:</strong> {selectedCart.layers}</p>
                            <p><strong>Material/Finish:</strong> {selectedCart.base_material} / {selectedCart.surface_finish}</p>
                            <p><strong>Zip File:</strong> <a href={`/uploads/${selectedCart.gerberZip}`} target='_blank' rel='noreferrer'>{selectedCart.gerberZip}</a></p>

                            <Form.Group className='mb-3' controlId='confirmedPrice'>
                                <Form.Label>Confirmed Price (THB)</Form.Label>
                                <Form.Control
                                    type='number'
                                    placeholder='Enter price'
                                    value={confirmedPrice}
                                    onChange={(e) => setConfirmedPrice(e.target.value)}
                                />
                            </Form.Group>

                            <Form.Group className='mb-3' controlId='remark'>
                                <Form.Label>Admin Remark</Form.Label>
                                <Form.Control
                                    as='textarea'
                                    rows={3}
                                    value={remark}
                                    onChange={(e) => setRemark(e.target.value)}
                                />
                            </Form.Group>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant='secondary' onClick={() => setShowModal(false)}>Close</Button>
                    <Button variant='danger' onClick={() => handleUpdateStatus('rejected')} disabled={loadingUpdate}>Reject</Button>
                    <Button variant='success' onClick={() => handleUpdateStatus('accepted')} disabled={loadingUpdate}>Approve & Set Price</Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}

export default OrderPCBCartListScreen
