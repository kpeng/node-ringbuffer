/**
 * RingBuffer implements a simple "ring" buffer based on the native node.js
 * buffer.  It basically keeps track of the current position in the buffer (mark)
 * and the remaining bytes based on how much data has been inserted so far.  It
 * will also automatically "rotate" the buffer to the zero position when the
 * buffer doesn't have enough free space to put additional data.
 */
var RingBuffer = function(size) {
    this.buffer_ = new Buffer(size);

    /// Maximum size in bytes that the ring buffer can hold.
    this.size_ = size;

    /// Current offset into the ring buffer.
    this.position_ = 0;

    /// Remaining bytes in the ring buffer to be read.
    this.remaining_ = 0;
};

/**
 * Returns the number of remaining bytes in the internal buffer.
 */
RingBuffer.prototype.remaining = function() {
    return this.remaining_;
};

/**
 * Copies a slice of the internal buffer into a new buffer so the user can
 * inspect it.  Does not consume the buffer.
 */
RingBuffer.prototype.peek = function(buffer, size) {
    if (size > this.remaining_)
        return false;
    this.buffer_.copy(buffer, 0, this.position_, this.position_ + size);
    return true;
};

/**
 * Puts bytes from a source buffer into the internal buffer.  Compacts the buffer
 * if needed.  Returns if the operation was successful.  put() will fail if the
 * internal buffer (after compaction) does not have space to hold the source
 * buffer.
 */
RingBuffer.prototype.put = function(buffer) {
    var size = buffer.length;

    if (this.position_ + this.remaining_ + size >= this.size_)
        this.compact();

    if (this.position_ + this.remaining_ + size >= this.size_)
        return false;

    buffer.copy(this.buffer_, this.position_ + this.remaining_);
    this.remaining_ += size;

    return true;
};

/**
 * Shifts the remaining data so that it is aligned at zero.
 */
RingBuffer.prototype.compact = function() {
    this.buffer_.copy(this.buffer_, 0, this.position_, this.position_ + this.remaining_);
    this.position_ = 0;
};

/**
 * Rewinds the current marker a set number of bytes.  Fails if the size requested
 * is larger than the current marker.
 */
RingBuffer.prototype.rewind = function(size) {
    if (size > this.position_)
        return false;
    this.position_ -= size;
    this.remaining_ += size;
    return true;
};

/**
 * Does the same thing as peek but moves the position marker forward if there's
 * enough bytes in the internal buffer.
 */
RingBuffer.prototype.get = function(buffer, size) {
    var state = this.peek(buffer, size);
    if (state) {
        this.position_ += size;
        this.remaining_ += size;
    }
    return state;
};

/**
 * Gets a specified length and formats it as a string.
 */
RingBuffer.prototype.getString = function(size, encoding) {
    // Default parameter for encoding is 'utf8'
    encoding = encoding || 'utf8';

    var buffer = new Buffer(size);
    var state = this.peek(buffer, size);
    if (state) {
        this.position_ += size;
        this.remaining_ -= size;
        return buffer.toString(encoding);
    }
    return null;
};

// This a bit tricky, but it's to generate the ability call any of the
// underlying buffer's useful integer reading capabilities.
[16, 32, 64].forEach(function(bits) {
    var unsigned_function_name = 'readUInt' + bits + 'BE';
    RingBuffer.prototype[unsigned_function_name] = function() {
        var value = this.buffer_[unsigned_function_name](this.position_);
        this.position_ += bits / 8;
        this.remaining_ -= bits / 8;
        return value;
    };
});

module.exports = RingBuffer;
